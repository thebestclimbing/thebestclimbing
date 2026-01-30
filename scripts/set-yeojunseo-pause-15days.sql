-- 여준서 회원: 회원권 정지 + 정지 시작일을 15일 전으로 설정 (정지일수 15 테스트용)
-- Supabase 대시보드 > SQL Editor에서 이 파일 내용을 붙여넣고 Run 실행

UPDATE public.profiles
SET
  membership_paused = true,
  membership_paused_at = to_char(CURRENT_DATE - 15, 'YYYYMMDD')::integer
WHERE name = '여준서';
