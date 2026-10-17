-- 비로그인 사용자(anon)도 공지/배차 등 공개 페이지에서 작성자/차주/탑승자 "이름"만 볼 수 있도록 허용.
-- RLS는 행 단위 제어라 특정 컬럼만 공개하려면 컬럼 단위 권한으로 제한해야 함.
-- 전화번호/이메일/회원권 등 민감 컬럼은 anon의 SELECT 권한에서 제외된다.
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, name) ON public.profiles TO anon;

CREATE POLICY "공개 이름 조회" ON public.profiles
  FOR SELECT TO anon
  USING (true);
