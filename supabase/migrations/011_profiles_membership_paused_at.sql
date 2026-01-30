-- 회원권 정지 시 정지 시작일을 YYYYMMDD 정수(일수/넘버타입)로 저장 (재개 시 정지된 일수만큼 종료일 연장에 사용)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_paused_at integer;

COMMENT ON COLUMN public.profiles.membership_paused_at IS '회원권 정지 시작일을 YYYYMMDD 정수로 저장. 재개 시 (오늘 - 이 일자) 일수만큼 membership_end에 가산';
