# Vercel 배포 가이드

## 1. 저장소 연결

1. [Vercel](https://vercel.com) 로그인 후 **Add New** → **Project**
2. GitHub/GitLab/Bitbucket에서 이 저장소 **Import**
3. **Framework Preset**: Next.js (자동 감지)
4. **Root Directory**: `./` (기본값)
5. **Build Command**: `npm run build` (기본값)
6. **Output Directory**: `.next` (기본값)

## 2. 환경 변수 설정 (필수)

**Settings** → **Environment Variables**에서 다음 변수를 추가하세요.

| 이름 | 값 | 비고 |
|------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anon/public key |

- **Environment**: Production, Preview, Development 모두 체크 권장
- 값은 [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 → **Settings** → **API**에서 확인

## 3. 배포

- **Deploy** 클릭 후 빌드가 완료되면 URL로 접속 가능
- 이후 `main`(또는 연결한 브랜치)에 push 시 자동 배포

## 4. 문제 해결

- **빌드 실패**: Vercel 빌드 로그에서 오류 확인. 환경 변수 미설정 시 일부 페이지에서 런타임 오류 가능.
- **RLS / 인증 오류**: Supabase에서 001~004 마이그레이션이 적용되었는지 확인.
