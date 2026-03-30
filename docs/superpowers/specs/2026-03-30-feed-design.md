# 소셜 피드 기능 설계 (인스타그램 스타일)

**날짜:** 2026-03-30
**상태:** 승인됨

## 개요

베스트클라이밍 회원들이 사진/동영상 게시글을 올리고, 서로의 피드를 구경하며 좋아요/댓글을 남길 수 있는 소셜 피드 기능. 기존 `/gallery` (사진첩)는 유지하고 `/feed` 로 신규 추가.

---

## 페이지 구조

| 경로 | 설명 |
|------|------|
| `/feed` | 전체 피드. 최신순. 카드↔그리드 전환 버튼. 우상단 ✏️ 버튼으로 새 게시글 작성. |
| `/feed/new` | 새 게시글 작성 (Cloudinary 업로드 + 캡션 입력) |
| `/feed/posts/[id]` | 게시글 상세. 미디어 슬라이드, 좋아요, 댓글 전체 |
| `/feed/users/[id]` | 회원 프로필. 아바타/이름/게시글 수 + 해당 회원 게시글 그리드 |

---

## 데이터베이스

### 신규 테이블 3개 (Migration: `020_feed.sql`)

```sql
-- 게시글
CREATE TABLE public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption TEXT NOT NULL DEFAULT '',
  media JSONB[] NOT NULL DEFAULT '{}',
  -- media 항목: { url: string, type: 'image' | 'video', thumbnail_url?: string }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 좋아요
CREATE TABLE public.feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 댓글
CREATE TABLE public.feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### RLS 정책

| 테이블 | 읽기 | 쓰기 | 삭제 |
|--------|------|------|------|
| `feed_posts` | 인증 회원 전체 | 본인만 | 본인만 |
| `feed_likes` | 인증 회원 전체 | 본인만 (insert) | 본인만 (delete) |
| `feed_comments` | 인증 회원 전체 | 인증 회원 | 본인만 |

---

## 미디어 스토리지 (Cloudinary)

- **플랜:** 무료 (25GB 스토리지, 25GB 대역폭/월)
- **업로드 방식:** Unsigned upload preset — 클라이언트에서 Cloudinary API로 직접 업로드
- **지원 형식:** 이미지 (jpg/png/webp), 동영상 (mp4)
- **업로드 제한:** 게시글당 최대 10개 파일
- **동영상 썸네일:** Cloudinary 자동 생성 URL 저장

### 신규 환경변수 (`.env.local`)

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```

### 업로드 흐름

```
사용자 파일 선택
  → 클라이언트에서 Cloudinary API 업로드 (fetch POST)
  → URL + type + thumbnail_url 반환
  → Supabase feed_posts.media[] 에 저장
```

---

## 주요 컴포넌트

### `/feed` 메인 피드
- 카드/그리드 상태는 `useState` 로 관리 (URL 파라미터 불필요)
- **카드 모드:** `FeedPostCard` 컴포넌트. 프로필 → 미디어 → 캡션 → 좋아요/댓글 수
- **그리드 모드:** 3열 정사각형. 동영상은 썸네일 + ▶ 아이콘 오버레이
- 초기 20개 Server Component 로드, 이후 클라이언트 페이징

### `/feed/new` 업로드 폼
- 파일 드래그&드롭 + 클릭 선택
- 업로드 진행률 표시
- 캡션 텍스트 입력 (선택사항)
- 등록 후 `/feed` 로 리다이렉트

### `/feed/posts/[id]` 상세
- 미디어 여러 장이면 좌우 슬라이드 (swipe/버튼)
- 좋아요: optimistic update (즉시 반영), API route `/api/feed/likes` (POST/DELETE)
- 댓글: 목록 + 입력창, submit 후 새로고침

### `/feed/users/[id]` 회원 프로필
- 프로필 아바타 (이름 이니셜), 이름, 게시글 수
- 게시글 그리드 (본인일 경우 삭제 버튼 노출)

---

## 네비게이션 추가

- **모바일 하단 탭:** 피드 탭 추가 (`AppShell.tsx`)
- **데스크탑 헤더:** "피드" 메뉴 항목 추가

---

## API Routes

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/feed/likes` | POST | 좋아요 추가 |
| `/api/feed/likes` | DELETE | 좋아요 취소 |

댓글 CRUD는 클라이언트에서 Supabase 직접 호출 (service role 불필요).

---

## 범위 밖 (v1 제외)

- 팔로우/팔로잉 시스템
- 알림 (좋아요/댓글 푸시)
- 해시태그/검색
- DM (다이렉트 메시지)
- 무한 스크롤 (v1은 페이지네이션)
