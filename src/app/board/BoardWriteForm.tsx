"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SubmitButton } from "@/components/SubmitButton";

type PostInitial = { id: string; title: string; body: string };

export default function BoardWriteForm({
  authorId,
  post,
  redirectTo,
}: {
  authorId: string;
  post?: PostInitial;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(post?.id);
  const listPath = redirectTo ?? "/board";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    setError("");
    setLoading(true);
    const supabase = createClient();
    if (isEdit) {
      const { error: err } = await supabase
        .from("free_board_posts")
        .update({ title: title.trim(), body: body.trim() })
        .eq("id", post!.id);
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
    } else {
      const { error: err } = await supabase.from("free_board_posts").insert({
        author_id: authorId,
        title: title.trim(),
        body: body.trim(),
      });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
    }
    router.push(listPath);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card rounded-2xl p-6">
      <div className="mb-4">
        <label className="mb-1 block text-sm text-[var(--chalk-muted)]">제목 *</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="input-base" />
      </div>
      <div className="mb-4">
        <label className="mb-1 block text-sm text-[var(--chalk-muted)]">본문</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="input-base min-h-[160px]" />
      </div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <SubmitButton
          loading={loading}
          loadingLabel={isEdit ? "수정 중..." : "등록 중..."}
          className="btn-primary disabled:pointer-events-none"
        >
          {isEdit ? "수정" : "등록"}
        </SubmitButton>
        <Link href={listPath} className="btn-outline inline-block px-4 py-3 text-center text-sm">
          취소
        </Link>
      </div>
    </form>
  );
}
