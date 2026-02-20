-- 암벽문제(루트) 테이블에 랭크포인트 컬럼 추가
ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS rank_point INTEGER;

COMMENT ON COLUMN public.routes.rank_point IS '랭크포인트 (난이도별 점수)';
