-- 트리거/함수 내에서 now() 등이 한국 시간 기준으로 동작하도록
-- 각 함수 실행 시 세션 timezone을 Asia/Seoul로 설정

-- 1. set_updated_at (updated_at 자동 갱신 트리거)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SET LOCAL timezone = 'Asia/Seoul';
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. handle_new_user (회원가입 시 profiles 생성 트리거)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb;
  pname text;
  pphone text;
  ptail4 text;
  digits text;
BEGIN
  SET LOCAL timezone = 'Asia/Seoul';
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  pname := COALESCE(nullif(trim(meta->>'name'), ''), '회원');
  pphone := COALESCE(nullif(trim(meta->>'phone'), ''), '');
  ptail4 := meta->>'phone_tail4';
  IF ptail4 IS NULL OR char_length(ptail4) <> 4 THEN
    digits := regexp_replace(pphone, '\D', '', 'g');
    ptail4 := lpad(right(digits, 4), 4, '0');
    IF char_length(ptail4) < 4 THEN
      ptail4 := lpad(digits, 4, '0');
    END IF;
  END IF;
  INSERT INTO public.profiles (id, name, email, phone, phone_tail4, role)
  VALUES (
    NEW.id,
    pname,
    NEW.email,
    pphone,
    ptail4,
    'member'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    phone_tail4 = EXCLUDED.phone_tail4,
    updated_at = now();
  RETURN NEW;
END;
$$;
