-- 공지 댓글 (로그인한 회원만 작성)
CREATE TABLE public.notice_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notice_comments_notice_id ON public.notice_comments(notice_id);
CREATE INDEX idx_notice_comments_created_at ON public.notice_comments(notice_id, created_at ASC);

ALTER TABLE public.notice_comments ENABLE ROW LEVEL SECURITY;

-- 읽기: 공지를 읽을 수 있는 경우 동일 (모두)
CREATE POLICY "공지 댓글 읽기" ON public.notice_comments
  FOR SELECT USING (true);

-- 작성: 로그인한 사용자만, 본인 author_id
CREATE POLICY "공지 댓글 작성" ON public.notice_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 수정/삭제: 본인 댓글만 (선택)
CREATE POLICY "공지 댓글 본인 수정삭제" ON public.notice_comments
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "공지 댓글 본인 삭제" ON public.notice_comments
  FOR DELETE USING (auth.uid() = author_id);
