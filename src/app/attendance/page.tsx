"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "지우기", "0", "확인"];

export default function AttendancePage() {
  const router = useRouter();
  const [digits, setDigits] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function handleKey(key: string) {
    if (key === "지우기") {
      setDigits((d) => d.slice(0, -1));
      setMessage(null);
      return;
    }
    if (key === "확인") {
      if (digits.length !== 4) {
        setMessage({ type: "error", text: "전화번호 뒤 4자리를 입력해 주세요." });
        return;
      }
      doCheck();
      return;
    }
    if (digits.length < 4) {
      setDigits((d) => d + key);
      setMessage(null);
    }
  }

  async function doCheck() {
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("phone_tail4", digits)
      .limit(1);
    if (!profiles?.length) {
      setMessage({ type: "error", text: "등록된 회원이 없습니다." });
      setLoading(false);
      return;
    }
    const profileId = profiles[0].id;
    const today = new Date().toISOString().slice(0, 10);
    const { error: insertError } = await supabase.from("attendances").insert({
      profile_id: profileId,
      attended_at: today,
    });
    setLoading(false);
    if (insertError) {
      if (insertError.code === "23505") {
        setMessage({ type: "ok", text: "오늘 이미 출석체크되었습니다." });
      } else {
        setMessage({ type: "error", text: insertError.message });
      }
      return;
    }
    setMessage({ type: "ok", text: `${profiles[0].name}님 출석 완료되었습니다.` });
    setDigits("");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        출석체크
      </h1>
      <p className="mb-4 text-sm text-zinc-500">
        전화번호 뒤 4자리를 입력해 주세요.
      </p>
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 text-center text-2xl tracking-[0.5em] text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        {digits.padEnd(4, "·")}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleKey(key)}
            disabled={loading && key === "확인"}
            className={
              key === "확인"
                ? "col-span-1 rounded-lg bg-zinc-900 py-3 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                : key === "지우기"
                  ? "rounded-lg border border-zinc-300 py-3 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  : "rounded-lg border border-zinc-300 py-3 text-lg font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }
          >
            {key}
          </button>
        ))}
      </div>
      {message && (
        <p
          className={`mt-4 text-center text-sm ${
            message.type === "ok"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
      <p className="mt-8 text-center">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          메인으로
        </Link>
      </p>
    </div>
  );
}
