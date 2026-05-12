-- 공지 타입 구분: 센터공지 | 등반공지 (기존 레코드는 센터공지로 자동 분류)
ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS notice_type text NOT NULL DEFAULT '센터공지'
  CHECK (notice_type IN ('센터공지', '등반공지'));

COMMENT ON COLUMN public.notices.notice_type IS '센터공지: 센터 운영 공지, 등반공지: 등반 관련 공지';
