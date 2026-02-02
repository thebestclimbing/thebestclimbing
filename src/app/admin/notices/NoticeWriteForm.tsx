"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SubmitButton } from "@/components/SubmitButton";

type NoticeInitial = { id: string; title: string; body: string; popup_yn?: "Y" | "N" };

export function NoticeWriteForm({
  authorId,
  notice,
}: {
  authorId: string;
  notice?: NoticeInitial;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(notice?.title ?? "");
  const [body, setBody] = useState(notice?.body ?? "");
  const [popupYn, setPopupYn] = useState<"Y" | "N">(notice?.popup_yn ?? "N");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(notice?.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    if (isEdit) {
      const { error: err } = await supabase
        .from("notices")
        .update({
          title: title.trim(),
          body: body.trim() || "",
          popup_yn: popupYn,
        })
        .eq("id", notice!.id);
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
    } else {
      const { error: err } = await supabase.from("notices").insert({
        author_id: authorId,
        title: title.trim(),
        body: body.trim() || "",
        popup_yn: popupYn,
      });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
    }
    router.push("/admin/notices");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card rounded-2xl p-6">
      <div className="grid gap-4">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm text-[var(--chalk-muted)]">
            제목 *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="input-base"
          />
        </div>
        <div>
          <label htmlFor="body" className="mb-1 block text-sm text-[var(--chalk-muted)]">
            내용
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="input-base min-h-[120px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="popup_yn"
            checked={popupYn === "Y"}
            onChange={(e) => setPopupYn(e.target.checked ? "Y" : "N")}
            className="rounded border-[var(--border)]"
          />
          <label htmlFor="popup_yn" className="text-sm text-[var(--chalk)]">
            팝업여부 Y (최초 사이트 진입 시 팝업으로 표시)
          </label>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4">
        <SubmitButton
          loading={loading}
          loadingLabel={isEdit ? "수정 중..." : "저장 중..."}
          className="btn-primary disabled:pointer-events-none"
        >
          {isEdit ? "수정" : "저장"}
        </SubmitButton>
      </div>
    </form>
  );
}
