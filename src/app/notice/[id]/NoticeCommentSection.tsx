"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNoticeComment } from "./actions";
import { formatDateTimeKST } from "@/lib/date";

export type CommentItem = {
  id: string;
  body: string;
  created_at: string;
  author: { id: string; name: string } | { id: string; name: string }[] | null;
};

function getAuthorName(author: CommentItem["author"]): string {
  if (!author) return "-";
  const a = Array.isArray(author) ? author[0] : author;
  return a?.name ?? "-";
}

export function NoticeCommentSection({
  noticeId,
  initialComments,
  isLoggedIn,
}: {
  noticeId: string;
  initialComments: CommentItem[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await createNoticeComment(noticeId, body);
    setPending(false);
    if (result.ok) {
      setBody("");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <section className="mt-8" aria-label="댓글">
      <h2 className="mb-4 text-lg font-semibold text-[var(--chalk)]">
        댓글 {initialComments.length > 0 && `(${initialComments.length})`}
      </h2>

      {isLoggedIn && (
        <form onSubmit={handleSubmit} className="mb-6">
          <label htmlFor="notice-comment-body" className="mb-1 block text-sm text-[var(--chalk-muted)]">
            댓글 작성
          </label>
          <textarea
            id="notice-comment-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="댓글을 입력하세요."
            rows={3}
            className="input-base mb-2 w-full resize-y"
            disabled={pending}
          />
          {error && (
            <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:pointer-events-none"
          >
            {pending ? "등록 중..." : "등록"}
          </button>
        </form>
      )}

      {!isLoggedIn && (
        <p className="mb-4 text-sm text-[var(--chalk-muted)]">
          로그인한 회원만 댓글을 남길 수 있습니다.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {initialComments.length === 0 ? (
          <li className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center text-sm text-[var(--chalk-muted)]">
            댓글이 없습니다.
          </li>
        ) : (
          initialComments.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-[var(--chalk)]">
                  {getAuthorName(c.author)}
                </span>
                <span className="text-[var(--chalk-muted)]">
                  {formatDateTimeKST(c.created_at)}
                </span>
              </div>
              <div className="whitespace-pre-wrap text-[var(--chalk)]">
                {c.body}
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
