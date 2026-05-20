# 이벤트 관리 시스템 Design Spec

## Goal

관리자가 클라이밍 미션 이벤트를 생성·관리하고, 회원은 진행 중인 이벤트와 자신의 달성 현황을 확인할 수 있는 시스템을 구축한다.

## Architecture

Next.js 16 App Router 서버 컴포넌트 + Supabase. 진행률은 기존 `exercise_logs` 테이블을 실시간 집계 쿼리로 계산한다. 별도 캐시 테이블 없이 항상 정확한 데이터를 제공한다. 상품 지급 기록만 `event_reward_logs`에 저장한다.

## Tech Stack

- Next.js 16 App Router (Server Components + Server Actions)
- Supabase (PostgreSQL)
- Tailwind CSS v4

---

## Data Model

### `events` 테이블

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK, default gen_random_uuid() | |
| `title` | text | NOT NULL | 이벤트 제목 |
| `description` | text | NOT NULL | 이벤트 설명 |
| `prize_description` | text | NOT NULL | 상품 설명 |
| `mission_type` | text | NOT NULL, CHECK IN ('route_completion','hold_count') | 미션 타입 |
| `required_count` | int | NOT NULL | 달성 기준 수 |
| `start_date` | date | NOT NULL | 시작일 (기간 조건 필수) |
| `end_date` | date | NOT NULL | 종료일 |
| `status` | text | NOT NULL, default 'draft', CHECK IN ('draft','active','ended') | |
| `image_url` | text | nullable | 배너 이미지 URL |
| `created_at` | timestamptz | default now() | |

### `event_routes` 테이블 — route_completion 타입 전용

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `event_id` | uuid | FK → events(id) ON DELETE CASCADE |
| `route_id` | uuid | FK → routes(id) ON DELETE CASCADE |
| PRIMARY KEY | (event_id, route_id) | |

### `event_reward_logs` 테이블 — 상품 지급 기록

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `id` | uuid | PK, default gen_random_uuid() |
| `event_id` | uuid | FK → events(id) ON DELETE CASCADE |
| `user_id` | uuid | FK → profiles(id) ON DELETE CASCADE |
| `rewarded_at` | timestamptz | default now() |
| `note` | text | nullable, 관리자 메모 |
| UNIQUE | (event_id, user_id) | 중복 지급 방지 |

---

## Progress Calculation

### route_completion

이벤트 기간(`start_date` ~ `end_date`) 내, 지정 루트(`event_routes`) 중 `is_completed = true`인 고유 루트 수를 집계.

```sql
SELECT COUNT(DISTINCT el.route_id)
FROM exercise_logs el
JOIN event_routes er ON el.route_id = er.route_id
WHERE er.event_id = $eventId
  AND el.profile_id = $userId
  AND el.is_completed = true
  AND el.date >= $startDate
  AND el.date <= $endDate
```

달성 여부: `count >= required_count`

### hold_count

이벤트 기간 내 `is_completed = true`인 exercise_log 총 건수 집계.

```sql
SELECT COUNT(*)
FROM exercise_logs
WHERE profile_id = $userId
  AND is_completed = true
  AND date >= $startDate
  AND date <= $endDate
```

달성 여부: `count >= required_count`

---

## Pages

### Admin

| 경로 | 설명 |
|---|---|
| `/admin/events` | 이벤트 목록 (테이블: 제목·미션타입·기간·상태·달성자수·수정·삭제) |
| `/admin/events/new` | 이벤트 생성 폼 |
| `/admin/events/[id]/edit` | 이벤트 수정 폼 |
| `/admin/events/[id]/achievements` | 달성자 목록 + 상품 지급 처리 |

**이벤트 생성·수정 폼 필드:**
- 제목, 설명, 상품 설명, 상태 (draft/active/ended), 시작일, 종료일
- 미션 타입 선택 (라디오)
  - `route_completion` 선택 시: routes 테이블에서 체크박스 다중 선택 + 달성 기준 개수 입력
  - `hold_count` 선택 시: 목표 횟수 입력

**달성자 목록 (`/admin/events/[id]/achievements`):**
- 달성 회원 목록 (달성 수 / required_count, 달성 완료된 회원만 표시)
- 각 행: 이름 / 달성 수 / 상품 지급 여부 (체크박스) / 메모 입력
- 지급 완료 체크 → `event_reward_logs` insert, 체크 해제 → delete

### Member

| 경로 | 설명 |
|---|---|
| `/events` | 진행중(active) 이벤트 카드 목록 + 내 진행률 |
| `/events/[id]` | 이벤트 상세 + 내 진행 현황 |

**이벤트 목록 카드:** 제목 / 기간 / 상품 / 진행률 바 (N/M) / 달성 완료 배지

**이벤트 상세:**
- 이벤트 설명, 상품 내용, 기간
- `route_completion`: 지정 루트 목록 + 각 루트 완등 여부 체크 아이콘
- `hold_count`: 기간 내 누적 완등 수 / 목표 횟수 + 프로그레스 바
- 상품 수령 완료 여부 표시

---

## Files

### New Files

```
supabase/migrations/XXXX_create_events.sql

src/app/admin/events/page.tsx
src/app/admin/events/actions.ts
src/app/admin/events/new/page.tsx
src/app/admin/events/[id]/edit/page.tsx
src/app/admin/events/[id]/achievements/page.tsx

src/app/events/page.tsx
src/app/events/[id]/page.tsx
```

### Modified Files

```
src/app/admin/page.tsx          — 이벤트관리 링크 추가
```

---

## Auth & Security

- 관리자 페이지: `profiles.role = 'admin'` 확인 후 접근 허용 (기존 패턴 동일)
- 회원 이벤트 페이지: 로그인 필수, 본인 진행률만 조회
- `event_reward_logs` write: 관리자 server action에서만 처리

---

## Out of Scope

- 이벤트 배너 이미지 업로드 (image_url 필드는 있으나 업로드 UI는 구현하지 않음 — URL 직접 입력)
- 이벤트 달성 시 푸시 알림
- 회원이 직접 이벤트 달성 신청
