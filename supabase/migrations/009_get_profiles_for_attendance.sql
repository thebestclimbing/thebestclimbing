-- 출석체크 시 전화뒷4자리로 프로필 조회 (비로그인/키오스크용, RLS 우회)
-- 회원권 만료일 포함 반환
CREATE OR REPLACE FUNCTION public.get_profiles_for_attendance(p_tail4 text)
RETURNS TABLE (id uuid, name text, phone text, membership_end date)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT pr.id, pr.name, pr.phone, pr.membership_end
  FROM public.profiles pr
  WHERE pr.phone_tail4 = p_tail4
    AND char_length(p_tail4) = 4;
$$;
