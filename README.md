# 베스트클라이밍 웹사이트

Next.js + Supabase 기반 클라이밍장 웹사이트입니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Database / Auth**: Supabase
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## 시작하기

### 1. 환경 변수

`.env.example`을 참고하여 `.env.local`을 생성하고 Supabase 값을 넣습니다.

```bash
cp .env.example .env.local
```

- [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택 → **Settings** → **API**에서 아래 값을 복사해 `.env.local`에 설정합니다.

  | 변수명 | 설명 |
  |--------|------|
  | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
  | `SUPABASE_SERVICE_ROLE_KEY` | **service_role** key (출석체크·관리자 기능용, **브라우저에 노출 금지**) |

  **출석체크**를 사용하려면 `SUPABASE_SERVICE_ROLE_KEY`를 반드시 설정하세요.  
  API 화면에서 **Project API keys** → **service_role** (Reveal 후 복사) → `.env.local`에 추가:

  ```bash
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

### 2. Supabase DB 마이그레이션

Supabase 프로젝트 생성 후, SQL Editor에서 아래 순서로 실행합니다.

1. `supabase/migrations/001_initial_schema.sql`  
2. `supabase/migrations/002_exercise_logs_public_completers.sql`  
3. `supabase/migrations/003_fix_profiles_rls_recursion.sql` (profiles RLS 무한 재귀 방지)
4. `supabase/migrations/004_profiles_trigger_on_signup.sql` (회원가입 시 profiles 자동 생성)

(또는 Supabase CLI 사용 시: `supabase db push`)

### 3. Vercel 배포

Vercel에 올릴 때는 **환경 변수**를 반드시 설정하세요.

- Vercel 프로젝트 → **Settings** → **Environment Variables**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
- **출석체크** 사용 시 `SUPABASE_SERVICE_ROLE_KEY`도 추가 (Production/Preview/Development 원하는 환경에 설정)

자세한 절차는 [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md)를 참고하세요.

### 4. 개발 서버 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

### 5. Vercel 빌드 확인 (로컬)

```bash
npm run build
```

배포 전 로컬에서 위 명령이 성공하는지 확인하세요. Vercel에서는 동일한 `npm run build`가 실행됩니다.

## 프로젝트 구조

- `docs/기획안.md` - 기능·화면정의·DB 설계 기획안
- `src/app/` - 페이지 라우트 (메인, 회원, 운동일지, 게시판, 관리자 등)
- `src/lib/supabase/` - Supabase 클라이언트 (브라우저/서버)
- `src/types/database.ts` - DB 타입 및 코드값
- `supabase/migrations/` - DB 스키마 및 RLS 정책

## 주요 기능

- **메인**: 오늘의 완등자, 주간 완등자
- **사용자**: 회원정보 조회, 나의 운동일지, 회원가입(QR), 일일체험 예약
- **공통**: 자유게시판, 공지사항, 출석체크, 사진첩, 통계
- **관리자**: 회원관리, 암벽문제관리, 출석관리, 일일체험예약자관리

자세한 화면·데이터 정의는 `docs/기획안.md`를 참고하세요.

**참고**

- **출석체크**: 비로그인 키오스크에서도 동작합니다. 서버에서 `SUPABASE_SERVICE_ROLE_KEY`로 출석을 등록하므로, 이 키가 없으면 "출석 등록 설정이 되어 있지 않습니다" 메시지가 나옵니다. `.env.local`(로컬) 및 Vercel 환경 변수(배포)에 `SUPABASE_SERVICE_ROLE_KEY`를 설정하세요.
- 관리자: `profiles.role = 'admin'`인 회원만 `/admin` 접근 가능. Supabase Dashboard에서 첫 관리자 프로필의 role을 수동으로 `admin`으로 변경하세요.
- **"Email rate limit exceeded"**: Supabase 무료 플랜은 이메일 발송 제한이 있습니다. **개발 중**에는 이메일 확인을 끄면 됩니다.  
  → [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 → **Authentication** → **Providers** → **Email** → **Confirm email** 끄기.  
  그러면 회원가입 후 바로 로그인 가능하고, 이메일 발송 제한에 걸리지 않습니다. 운영 환경에서는 **Custom SMTP** 설정으로 본인 메일 서버를 쓰는 것을 권장합니다.
