"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "notice_popup_shown";

export function NoticePopup() {
  const [notice, setNotice] = useState<{ id: string; title: string; body: string } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    const supabase = createClient();
    supabase
      .from("notices")
      .select("id, title, body")
      .eq("popup_yn", "Y")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setNotice(data);
          setOpen(true);
        }
      });
  }, []);

  function close() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  if (!open || !notice) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={close}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold text-[var(--chalk)]">{notice.title}</h2>
        <div className="whitespace-pre-wrap text-sm text-[var(--chalk-muted)]">
          {notice.body || "(내용 없음)"}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={close}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
