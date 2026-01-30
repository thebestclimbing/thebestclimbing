"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "지우기", "0", "확인"];

type ProfileRow = { id: string; name: string; phone: string };

export default function AttendancePage() {
  const router = useRouter();
  const [digits, setDigits] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectModal, setSelectModal] = useState<ProfileRow[] | null>(null);

  function handleKey(key: string) {
    if (key === "지우기") {
      setDigits((d) => d.slice(0, -1));
      setMessage(null);
      setSelectModal(null);
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
      setSelectModal(null);
    }
  }

  async function submitAttendance(profileId: string, profileName: string) {
    setLoading(true);
    setMessage(null);
    const today = new Date().toISOString().slice(0, 10);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("attendances").insert({
      profile_id: profileId,
      attended_at: today,
    });
    setLoading(false);
    setSelectModal(null);
    if (insertError) {
      if (insertError.code === "23505") {
        setMessage({ type: "ok", text: "오늘 이미 출석체크되었습니다." });
      } else {
        setMessage({ type: "error", text: insertError.message });
      }
      return;
    }
    setMessage({ type: "ok", text: `${profileName}님 출석 완료되었습니다.` });
    setDigits("");
    router.refresh();
  }

  async function doCheck() {
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, phone")
      .eq("phone_tail4", digits);

    setLoading(false);

    if (!profiles?.length) {
      setMessage({ type: "error", text: "등록된 회원이 없습니다." });
      return;
    }
    if (profiles.length === 1) {
      await submitAttendance(profiles[0].id, profiles[0].name);
      setLoading(true);
      return;
    }
    setSelectModal(profiles as ProfileRow[]);
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">
        출석체크
      </h1>
      <p className="mb-4 text-sm text-[var(--chalk-muted)]">
        전화번호 뒤 4자리를 입력해 주세요.
      </p>
      <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 text-center text-2xl tracking-[0.5em] text-[var(--chalk)]">
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
                ? "col-span-1 rounded-xl bg-[var(--rope)] py-3 font-medium text-white transition hover:bg-[var(--rope-light)] active:scale-95 disabled:opacity-50"
                : key === "지우기"
                  ? "rounded-xl border border-[var(--border)] py-3 text-sm transition hover:bg-[var(--surface-elevated)] active:scale-95"
                  : "rounded-xl border border-[var(--border)] py-3 text-lg font-medium transition hover:bg-[var(--surface-elevated)] active:scale-95"
            }
          >
            {key}
          </button>
        ))}
      </div>
      {message && (
        <p
          className={`mt-4 text-center text-sm ${
            message.type === "ok" ? "text-green-400" : "text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* 2명 이상일 때 회원 선택 모달 */}
      {selectModal && selectModal.length > 1 && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setSelectModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl bg-[var(--surface-elevated)] p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-[var(--chalk)]">
              회원 선택
            </h3>
            <p className="mb-4 text-sm text-[var(--chalk-muted)]">
              전화번호 뒤 4자리가 같은 회원이 여러 명입니다. 출석할 회원을 선택하세요.
            </p>
            <ul className="flex flex-col gap-2">
              {selectModal.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => submitAttendance(p.id, p.name)}
                    disabled={loading}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-[var(--chalk)] transition hover:bg-[var(--rope)]/20 active:scale-[0.98] disabled:opacity-50"
                  >
                    <span className="font-medium">{p.name}</span>
                    {p.phone && (
                      <span className="ml-2 text-sm text-[var(--chalk-muted)]">
                        {p.phone}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setSelectModal(null)}
              className="mt-4 w-full rounded-xl border border-[var(--border)] py-2.5 text-sm text-[var(--chalk-muted)]"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <p className="mt-8 text-center">
        <Link href="/" className="text-sm text-[var(--chalk-muted)] hover:underline">
          메인으로
        </Link>
      </p>
    </div>
  );
}
