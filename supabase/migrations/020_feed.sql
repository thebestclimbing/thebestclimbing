-- 소셜 피드 테이블

-- 게시글
CREATE TABLE public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption TEXT NOT NULL DEFAULT '',
  media JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 좋아요
CREATE TABLE public.feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 댓글
CREATE TABLE public.feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_feed_posts_author ON public.feed_posts(author_id, created_at DESC);
CREATE INDEX idx_feed_likes_post ON public.feed_likes(post_id);
CREATE INDEX idx_feed_likes_user ON public.feed_likes(user_id);
CREATE INDEX idx_feed_comments_post ON public.feed_comments(post_id, created_at ASC);

-- updated_at 트리거
CREATE TRIGGER feed_posts_updated_at BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- RLS 활성화
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- feed_posts RLS
CREATE POLICY "피드 읽기" ON public.feed_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "피드 작성" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "피드 삭제" ON public.feed_posts FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "피드 수정" ON public.feed_posts FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

-- feed_likes RLS
CREATE POLICY "좋아요 읽기" ON public.feed_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "좋아요 추가" ON public.feed_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "좋아요 취소" ON public.feed_likes FOR DELETE USING (auth.uid() = user_id);

-- feed_comments RLS
CREATE POLICY "댓글 읽기" ON public.feed_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "댓글 작성" ON public.feed_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "댓글 삭제" ON public.feed_comments FOR DELETE USING (auth.uid() = author_id);
