import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeKST } from "@/lib/date";
import { NoticeCommentSection } from "./NoticeCommentSection";

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: notice, error } = await supabase
    .from("notices")
    .select(
      `
      id,
      title,
      body,
      created_at,
      author:profiles(id, name)
    `
    )
    .eq("id", id)
    .single();

  if (error || !notice) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: comments } = await supabase
    .from("notice_comments")
    .select(
      `
      id,
      body,
      created_at,
      author:profiles(id, name)
    `
    )
    .eq("notice_id", id)
    .order("created_at", { ascending: true });

  const row = notice as unknown as {
    id: string;
    title: string;
    body: string;
    created_at: string;
    author: { id: string; name: string } | { id: string; name: string }[] | null;
  };
  const author = Array.isArray(row.author) ? row.author[0] : row.author;

  type CommentRow = {
    id: string;
    body: string;
    created_at: string;
    author: { id: string; name: string } | { id: string; name: string }[] | null;
  };
  const commentList = (comments ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    author: (c as unknown as CommentRow).author,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <article className="card rounded-2xl p-6">
        <h1 className="mb-4 text-2xl font-bold text-[var(--chalk)]">
          {row.title}
        </h1>
        <div className="mb-4 flex gap-4 text-sm text-[var(--chalk-muted)]">
          <span>작성자: {author?.name ?? "-"}</span>
          <span>작성일자: {formatDateTimeKST(row.created_at)}</span>
        </div>
        <div className="whitespace-pre-wrap text-[var(--chalk)]">
          {row.body || "(내용 없음)"}
        </div>
      </article>

      <NoticeCommentSection
        noticeId={id}
        initialComments={commentList}
        isLoggedIn={!!user}
      />

      <p className="mt-6">
        <Link
          href="/notice"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          목록으로
        </Link>
      </p>
    </div>
  );
}
