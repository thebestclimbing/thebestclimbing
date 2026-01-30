-- 완등요청 플래그 (회원이 완등요청 → 관리자가 완등처리 시 is_completed = true)
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS completion_requested boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.exercise_logs.completion_requested IS 'true: 회원이 완등요청한 상태, 관리자 완등처리 시 is_completed로 이관';
