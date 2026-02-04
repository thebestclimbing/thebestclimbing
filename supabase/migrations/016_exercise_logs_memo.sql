-- 운동일지 메모 (회원이 해당 일지에 남기는 메모)
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS memo TEXT;

COMMENT ON COLUMN public.exercise_logs.memo IS '회원이 해당 운동일지에 남기는 메모';
