"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NoticeDeleteButton({ noticeId }: { noticeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("이 공지를 삭제하시겠습니까?")) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("notices").delete().eq("id", noticeId);
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.push("/admin/notices");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {loading ? "삭제 중..." : "삭제"}
    </button>
  );
}
