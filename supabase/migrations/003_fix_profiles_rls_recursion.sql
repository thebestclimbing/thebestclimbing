-- profiles 정책에서 같은 테이블을 참조해 무한 재귀가 발생하므로
-- SECURITY DEFINER 함수로 관리자 여부만 검사하도록 변경

-- 1. RLS를 우회해 현재 사용자 admin 여부만 반환하는 함수
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. profiles의 재귀를 일으키는 정책 삭제 후 함수 사용으로 재생성
DROP POLICY IF EXISTS "관리자 프로필 전체" ON public.profiles;
CREATE POLICY "관리자 프로필 전체" ON public.profiles
  FOR ALL USING (public.is_admin());
