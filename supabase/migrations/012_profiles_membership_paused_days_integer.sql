-- (011을 date로 이미 적용한 DB용) 정지시작일 컬럼을 date → integer(YYYYMMDD) 로 변경
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
    AND column_name = 'membership_paused_at' AND data_type = 'date'
  ) THEN
    ALTER TABLE public.profiles
      ALTER COLUMN membership_paused_at TYPE integer
      USING (CASE WHEN membership_paused_at IS NOT NULL THEN to_char(membership_paused_at, 'YYYYMMDD')::integer ELSE NULL END);
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.membership_paused_at IS '회원권 정지 시작일을 YYYYMMDD 정수로 저장. 재개 시 (오늘 - 이 일자) 일수만큼 membership_end에 가산';
