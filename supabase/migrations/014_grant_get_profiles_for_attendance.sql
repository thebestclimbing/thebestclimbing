-- 출석체크: 비로그인(anon)에서 전화뒷4자리로 회원 조회 가능하도록 RPC 실행 권한 부여
-- get_profiles_for_attendance는 SECURITY DEFINER라서 anon이 호출해도 프로필 조회 가능

GRANT EXECUTE ON FUNCTION public.get_profiles_for_attendance(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_profiles_for_attendance(text) TO authenticated;
