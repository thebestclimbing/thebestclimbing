"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatPhone } from "@/lib/format";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "지우기", "0", "확인"];

type ProfileRow = { id: string; name: string; phone: string; membership_end: string | null };

export default function AttendancePage() {
  const router = useRouter();
  const [digits, setDigits] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectModal, setSelectModal] = useState<ProfileRow[] | null>(null);
  const defaultBase = process.env.NEXT_PUBLIC_APP_URL || "https://thebestclmbing.vercel.app";
  const [registerUrl, setRegisterUrl] = useState(`${defaultBase}/member/register`);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setRegisterUrl(`${window.location.origin}/member/register`);
    }
  }, []);

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

  async function submitAttendance(profileId: string, profileName: string, membershipEnd: string | null) {
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
    const dday = formatDday(membershipEnd);
    const expiryText = membershipEnd ? ` 회원권 만료: ${membershipEnd} (${dday})` : "";
    setMessage({ type: "ok", text: `${profileName}님 출석 완료되었습니다.${expiryText}` });
    setDigits("");
  }

  async function doCheck() {
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { data: profiles } = await supabase.rpc("get_profiles_for_attendance", {
      p_tail4: digits,
    });

    setLoading(false);

    if (!profiles?.length) {
      setMessage({ type: "error", text: "등록된 회원이 없습니다." });
      return;
    }
    if (profiles.length === 1) {
      await submitAttendance(profiles[0].id, profiles[0].name, profiles[0].membership_end);
      return;
    }
    setSelectModal((profiles ?? []) as ProfileRow[]);
  }

  function formatDday(isoDate: string | null): string {
    if (!isoDate) return "-";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(isoDate + "T12:00:00");
    end.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0) return `D-${diff}`;
    if (diff === 0) return "D-Day";
    return `D+${-diff}`;
  }

  function closeResultModal() {
    setMessage(null);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">
        출석체크
      </h1>

      {/* 회원가입 링크 QR코드 */}
      {registerUrl && (
        <div className="mb-6 flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="mb-2 text-sm font-medium text-[var(--chalk)]">회원가입 바로가기</p>
          <p className="mb-3 text-xs text-[var(--chalk-muted)]">QR 스캔 시 회원가입 페이지로 이동</p>
          <a
            href="/member/register"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-xl border-2 border-[var(--border)] bg-white p-2"
            aria-label="회원가입 QR코드"
          >
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(registerUrl)}`}
              alt="회원가입 링크 QR코드"
              width={160}
              height={160}
              className="block"
            />
          </a>
          <Link
            href="/member/register"
            className="mt-3 inline-block text-sm font-medium text-[var(--primary)] underline hover:no-underline"
          >
            회원가입
          </Link>
        </div>
      )}

      <div className="card mb-6 rounded-2xl p-5 text-center text-2xl tracking-[0.5em] text-[var(--chalk)]">
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
                ? "col-span-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 font-medium text-white transition hover:bg-[var(--primary-hover)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                : key === "지우기"
                  ? "rounded-xl border border-[var(--border)] py-3 text-sm transition hover:bg-[var(--surface-muted)] active:scale-95"
                  : "rounded-xl border border-[var(--border)] py-3 text-lg font-medium transition hover:bg-[var(--surface-muted)] active:scale-95"
            }
          >
            {key === "확인" && loading ? (
              <>
                <LoadingSpinner size="sm" className="text-white" />
                확인 중...
              </>
            ) : (
              key
            )}
          </button>
        ))}
      </div>

      {/* 결과 모달: 확인 버튼 누르면 닫고 새로고침 */}
      {message && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={closeResultModal}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl bg-[var(--surface)] p-6 shadow-lg sm:rounded-2xl border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              className={`mb-6 text-center text-sm ${
                message.type === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {message.text}
            </p>
            <button
              type="button"
              onClick={closeResultModal}
              className="w-full rounded-xl bg-[var(--primary)] py-3 font-medium text-white transition hover:bg-[var(--primary-hover)]"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 2명 이상일 때 회원 선택 모달 */}
      {selectModal && selectModal.length > 1 && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setSelectModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl bg-[var(--surface)] p-6 shadow-lg sm:rounded-2xl border border-[var(--border)]"
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
                    onClick={() => submitAttendance(p.id, p.name, p.membership_end)}
                    disabled={loading}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-[var(--chalk)] transition hover:bg-[var(--primary-muted)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        출석 처리 중...
                      </span>
                    ) : (
                      <>
                        <span className="font-medium">{p.name}</span>
                        {p.phone && (
                          <span className="ml-2 text-sm text-[var(--chalk-muted)]">{formatPhone(p.phone)}</span>
                        )}
                        <span className="mt-1 block text-xs text-[var(--chalk-muted)]">
                          회원권 만료: {p.membership_end ?? "-"} ({formatDday(p.membership_end)})
                        </span>
                      </>
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
