"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("게시글을 삭제할까요? 사진도 함께 삭제됩니다.")) return;
    setLoading(true);
    const res = await fetch(`/api/feed/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/feed");
      router.refresh();
    } else {
      alert("삭제 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1 text-sm text-red-500 hover:text-red-400 disabled:opacity-50"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      {loading ? "삭제 중..." : "삭제"}
    </button>
  );
}
