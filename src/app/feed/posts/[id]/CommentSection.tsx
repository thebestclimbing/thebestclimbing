"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FeedComment } from "../../types";
import { formatDateTimeKST } from "@/lib/date";

export function CommentSection({
  postId,
  initialComments,
  currentUserId,
}: {
  postId: string;
  initialComments: FeedComment[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !currentUserId) return;
    setSubmitting(true);
    setError("");

    const supabase = createClient();
    const { error: err } = await supabase.from("feed_comments").insert({
      post_id: postId,
      author_id: currentUserId,
      body: body.trim(),
    });

    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setBody("");
    router.refresh();
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("feed_comments").delete().eq("id", commentId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--chalk)]">
        댓글 {initialComments.length}개
      </h2>

      <div className="flex flex-col gap-3">
        {initialComments.map((comment) => {
          const author = Array.isArray(comment.author) ? comment.author[0] : comment.author;
          return (
            <div key={comment.id} className="flex gap-2">
              <Link href={`/feed/users/${comment.author_id}`}>
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-xs font-semibold text-[var(--chalk)]">
                  {(author?.name ?? "?").slice(0, 2)}
                </span>
              </Link>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <Link
                    href={`/feed/users/${comment.author_id}`}
                    className="text-xs font-semibold text-[var(--chalk)] hover:text-[var(--primary)]"
                  >
                    {author?.name ?? "-"}
                  </Link>
                  <span className="text-xs text-[var(--chalk-muted)]">
                    {formatDateTimeKST(comment.created_at)}
                  </span>
                  {currentUserId === comment.author_id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="ml-auto text-xs text-[var(--chalk-muted)] hover:text-red-500"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-[var(--chalk)]">{comment.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="댓글 달기..."
            className="input-base flex-1 text-sm"
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            게시
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-[var(--chalk-muted)]">
          <Link href="/login" className="text-[var(--primary)] underline">로그인</Link>
          하면 댓글을 달 수 있습니다.
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
