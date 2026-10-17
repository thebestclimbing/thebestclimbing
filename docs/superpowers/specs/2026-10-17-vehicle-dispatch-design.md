# 차량 배차 관리 Design Spec

## Goal

등반공지(원정)에서 차량으로 이동할 때, 회원이 사전에 등록해둔 차량 정보를 바탕으로 관리자가 공지별로 차량을 배정하고 각 차량에 탑승자를 배치할 수 있는 기능을 구축한다.

## Architecture

Next.js 16 App Router + Supabase, 기존 `notices` 도메인을 확장하는 구조. 새로운 회원 차량 정보(`member_vehicles`)와 공지별 배차 데이터(`notice_dispatches`, `dispatch_passengers`)를 분리된 테이블로 둔다. 배차 관리 UI는 공지 작성/수정 폼(`NoticeWriteForm.tsx`)에 통합되며, `notice_type === '등반공지'`일 때만 노출된다.

## Tech Stack

- Next.js 16 App Router (Server Components + Client Components)
- Supabase (PostgreSQL, RLS)
- Tailwind CSS v4

---

## Data Model

### `member_vehicles` 테이블 — 회원 차량 정보

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK, default gen_random_uuid() | |
| `profile_id` | uuid | FK → profiles(id) ON DELETE CASCADE, **UNIQUE** | 1인당 1대 제한 |
| `model` | text | NOT NULL | 차종/모델명 |
| `seat_count` | int | NOT NULL | 탑승 가능 인원(운전자 포함 전체) |
| `memo` | text | nullable | 기타 메모 |
| `created_at` | timestamptz | default now() | |
| `updated_at` | timestamptz | default now() | |

### `notice_dispatches` 테이블 — 공지에 배정된 차량

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK, default gen_random_uuid() | |
| `notice_id` | uuid | FK → notices(id) ON DELETE CASCADE | |
| `vehicle_id` | uuid | FK → member_vehicles(id) ON DELETE CASCADE | |
| `created_at` | timestamptz | default now() | |
| UNIQUE | (notice_id, vehicle_id) | | 같은 차량 중복 추가 방지 |

### `dispatch_passengers` 테이블 — 차량별 탑승자

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK, default gen_random_uuid() | |
| `dispatch_id` | uuid | FK → notice_dispatches(id) ON DELETE CASCADE | |
| `notice_id` | uuid | FK → notices(id) ON DELETE CASCADE | 중복배정 방지용 비정규화 컬럼 |
| `profile_id` | uuid | FK → profiles(id) ON DELETE CASCADE | |
| `created_at` | timestamptz | default now() | |
| UNIQUE | (notice_id, profile_id) | | 한 공지 내 한 사람이 여러 차에 중복 배정되는 것 방지 |

`member_vehicles` 삭제 시 `notice_dispatches` → `dispatch_passengers`까지 CASCADE로 함께 삭제된다. 소유자가 차량 정보를 지우면 해당 차량이 걸려 있던 모든 공지의 배차 기록도 자동 정리된다.

---

## RLS 정책

### `member_vehicles`

```sql
CREATE POLICY "차량 정보 공개 조회" ON public.member_vehicles
  FOR SELECT USING (true);

CREATE POLICY "차량 정보 본인 관리" ON public.member_vehicles
  FOR ALL USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
```

관리자도 타인의 차량 정보를 쓰지 못한다. 조회만 가능.

### `notice_dispatches`, `dispatch_passengers`

```sql
CREATE POLICY "배차 공개 조회" ON public.notice_dispatches
  FOR SELECT USING (true);

CREATE POLICY "배차 관리자" ON public.notice_dispatches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

`dispatch_passengers`도 동일한 패턴 (조회 공개, 쓰기는 `profiles.role = 'admin'`만). 기존 `notices` 테이블의 `공지 읽기`/`공지 관리자` 정책과 동일한 구조를 따른다.

---

## Pages & UI

### `/member` — 내 차량 정보

- 기존 읍기 전용 프로필 페이지(`src/app/member/page.tsx`)에 "내 차량 정보" 카드 신규 추가.
- 미등록 상태: 모델명/좌석수/메모 입력 폼 (등록 버튼).
- 등록 완료 상태: 같은 필드를 조회+수정 가능한 폼으로 표시 (수정 버튼), 삭제 버튼 포함.
- `profile_id` UNIQUE 제약으로 1대 제한을 DB 레벨에서 보장. 클라이언트는 upsert(`onConflict: 'profile_id'`)로 처리.

### 공지 작성/수정 폼 — `NoticeWriteForm.tsx`

- `notice_type === '등반공지'`일 때만 "배차 관리" 섹션 노출 (기존 `noticeType` state로 분기).
- 섹션 내용:
  - 등록된 차량 목록(전체 회원 대상, `소유자 이름 — 모델명 (좌석수인승)` 형태)에서 선택해 추가. 미등록 회원은 목록에 없으므로 자동 제외.
  - 추가된 차량 카드마다 탑승자 추가 UI (회원 검색/선택). 이미 해당 공지에서 다른 차에 배정된 회원은 선택지에서 제외.
  - 탑승자 수가 `seat_count`를 초과하면 경고 문구만 표시, 저장은 막지 않음.
- **신규 작성(`/admin/notices/new`)**: `notice_id`가 없는 상태이므로 배차 구성(선택된 차량 + 탑승자 배정)을 폼 로컬 상태로만 보관한다. "저장" 클릭 시:
  1. `notices` insert → 생성된 `id` 획득
  2. 그 `id`로 `notice_dispatches` insert (선택된 차량들)
  3. 각 dispatch의 `id`로 `dispatch_passengers` insert (배정된 탑승자들)
- **수정(`/admin/notices/[id]/edit`)**: 기존 배차 데이터를 `notice_id`로 조회해 초기 상태로 로드. 추가/삭제/재배정 후 "저장" 시 현재 상태와 DB 상태를 비교해 diff만 반영 (삭제된 차량/탑승자는 delete, 새로 추가된 것은 insert).

### 공지 상세 페이지 — `src/app/notice/[id]/page.tsx`

- 쿼리에 `notice_type` 컬럼 추가 (현재 select에 없음 — 추가 필요).
- `notice_type === '등반공지'`일 때 읍기 전용 "배차 현황" 섹션 노출.
- 차량별로 `모델명 — 소유자 이름` + 탑승자 이름 목록을 표시. 로그인 여부와 무관하게 조회 가능 (RLS가 공개 조회를 허용하므로 기존 패턴과 동일하게 추가 인증 분기 불필요).
- 배차된 차량이 없으면 섹션 자체를 숨긴다.

---

## Files

### New Files

```
supabase/migrations/035_create_member_vehicles.sql
supabase/migrations/036_create_notice_dispatches.sql

src/app/member/MemberVehicleForm.tsx

src/app/admin/notices/DispatchManager.tsx   — 차량 추가/탑승자 배정 공용 섹션 (신규+수정 폼 공용)

src/app/notice/[id]/DispatchDisplay.tsx     — 공지 상세 읍기 전용 배차 현황
```

### Modified Files

```
src/types/database.ts                  — MemberVehicle, NoticeDispatch, DispatchPassenger 타입 추가
src/app/member/page.tsx                — MemberVehicleForm 섹션 추가
src/app/admin/notices/NoticeWriteForm.tsx — DispatchManager 통합 (notice_type === '등반공지' 조건)
src/app/notice/[id]/page.tsx           — notice_type 쿼리 추가, DispatchDisplay 섹션 추가
```

---

## Auth & Security

- `member_vehicles` 쓰기: 본인만 (`profile_id = auth.uid()`). 관리자도 타인 차량 정보 수정 불가.
- `notice_dispatches` / `dispatch_passengers` 쓰기: `profiles.role = 'admin'`만.
- 모든 조회(차량 정보, 배차 현황)는 로그인 없이 공개 — 기존 `notices` 공개 조회 패턴과 동일.

---

## Out of Scope

- 차량번호(번호판) 입력 — 명시적으로 제외.
- 회원 본인이 직접 탑승 신청/취소 — 배정은 관리자가 수동으로만 처리.
- 임시(비등록) 차량으로 배차 — 등록된 차량만 선택 가능.
- 좌석 초과 시 저장 차단 — 경고만 표시.
