-- 공지 팝업 여부 (Y: 최초 진입 시 팝업 표시)
ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS popup_yn text NOT NULL DEFAULT 'N'
  CHECK (popup_yn IN ('Y', 'N'));

COMMENT ON COLUMN public.notices.popup_yn IS 'Y: 최초 사이트 진입 시 팝업 표시';
