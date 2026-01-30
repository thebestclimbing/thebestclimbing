-- 회원권 정지/시작 기능용 컬럼
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_paused boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.membership_paused IS 'true: 회원권 정지, false: 정상';
