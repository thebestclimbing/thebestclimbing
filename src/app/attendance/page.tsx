"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  // PC: 키보드로 숫자/지우기/확인 입력
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("input") || target.closest("textarea") || target.closest("[contenteditable]")) return;

      const key = e.key;
      if (key >= "0" && key <= "9") {
        e.preventDefault();
        handleKey(key);
        return;
      }
      if (key === "Backspace") {
        e.preventDefault();
        handleKey("지우기");
        return;
      }
      if (key === "Enter") {
        e.preventDefault();
        handleKey("확인");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [digits, loading]); // handleKey가 digits/loading을 참조하므로 의존

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

  async function submitAttendance(
    tail4: string,
    profileId: string,
    _profileName: string,
    _membershipEnd: string | null
  ) {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tail4, profileId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setSelectModal(null);
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "출석 등록에 실패했습니다." });
      return;
    }
    if (data.already) {
      setMessage({ type: "ok", text: "오늘 이미 출석체크되었습니다." });
      setDigits("");
      return;
    }
    const dday = formatDday(data.membershipEnd ?? null);
    const expiryText = data.membershipEnd
      ? ` 회원권 만료: ${data.membershipEnd} (${dday})`
      : "";
    setMessage({
      type: "ok",
      text: `${data.profileName}님 출석 완료되었습니다.${expiryText}`,
    });
    setDigits("");
  }

  async function doCheck() {
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/attendance/profiles?tail4=${encodeURIComponent(digits)}`);
    let profiles: ProfileRow[] = [];
    let errorText = "등록된 회원이 없습니다.";
    if (res.ok) {
      const data = await res.json();
      profiles = Array.isArray(data) ? data : [];
    } else {
      const data = await res.json().catch(() => ({}));
      if (typeof data?.error === "string") errorText = data.error;
    }
    setLoading(false);

    if (!profiles.length) {
      setMessage({ type: "error", text: errorText });
      return;
    }
    if (profiles.length === 1) {
      await submitAttendance(
        digits,
        profiles[0].id,
        profiles[0].name,
        profiles[0].membership_end
      );
      return;
    }
    setSelectModal(profiles);
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
    <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-4 md:h-[100dvh] md:min-h-0 md:flex-row md:items-stretch md:justify-center md:overflow-hidden md:py-0 md:gap-10 lg:gap-14 lg:px-6 xl:gap-16 xl:px-8">
      {/* 왼쪽: 출석체크 (숫자 입력 + 키패드) - PC에서 화면 꽉 채움 */}
      <div className="flex flex-1 flex-col items-center justify-center md:min-h-0 md:min-w-0 md:py-6">
        <div className="mx-auto flex w-full max-w-[390px] flex-1 flex-col md:max-w-[468px] md:min-h-0 lg:max-w-[520px]">
          <div className="card mb-3 w-full flex-shrink-0 rounded-2xl p-4 text-center text-2xl tracking-[0.5em] text-[var(--chalk)] md:mb-4 md:p-5 md:text-3xl lg:p-6 lg:text-4xl">
            {digits.padEnd(4, "·")}
          </div>
          <div className="grid w-full flex-1 grid-cols-3 grid-rows-4 gap-2 min-h-0 md:gap-3 lg:gap-4">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              disabled={loading && key === "확인"}
              className={
                key === "확인"
                  ? "col-span-1 inline-flex h-full min-h-0 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 font-medium text-white transition hover:bg-[var(--primary-hover)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none md:py-5 md:text-lg lg:py-6 lg:text-xl"
                  : key === "지우기"
                    ? "h-full min-h-0 rounded-xl border border-[var(--border)] py-3 text-sm transition hover:bg-[var(--surface-muted)] active:scale-95 md:py-5 lg:py-6 lg:text-base inline-flex items-center justify-center"
                    : "h-full min-h-0 rounded-xl border border-[var(--border)] py-3 text-lg font-medium transition hover:bg-[var(--surface-muted)] active:scale-95 md:py-5 md:text-xl lg:py-6 lg:text-2xl inline-flex items-center justify-center"
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
        </div>
      </div>

      {/* 오른쪽: 회원가입 QR (PC에서 같은 행, 2분할) */}
      {registerUrl && (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center md:mt-0 md:min-w-0">
          <p className="mb-2 text-sm font-medium text-[var(--chalk)] md:text-base lg:text-lg">회원가입 바로가기</p>
          <p className="mb-2 text-xs text-[var(--chalk-muted)] md:mb-3 lg:text-sm">QR 스캔 시 회원가입 페이지로 이동</p>
          <a
            href="/member/register"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-xl border-2 border-[var(--border)] bg-white p-2 lg:p-3"
            aria-label="회원가입 QR코드"
          >
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(registerUrl)}`}
              alt="회원가입 링크 QR코드"
              width={160}
              height={160}
              className="block h-28 w-28 md:h-36 md:w-36 lg:h-44 lg:w-44"
            />
          </a>
          <Link
            href="/member/register"
            className="mt-3 inline-block text-sm font-medium text-[var(--primary)] underline hover:no-underline md:text-base lg:text-lg"
          >
            회원가입
          </Link>
        </div>
      )}

      {/* 메인으로 - 우측 상단 버튼 (PC에서만 표시) */}
      <Link
        href="/"
        className="absolute right-4 top-4 z-10 hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--chalk)] shadow-sm transition hover:bg-[var(--surface-muted)] md:right-6 md:top-6 md:inline-block md:px-5 md:py-3 md:text-base"
      >
        메인으로
      </Link>

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
                    onClick={() => submitAttendance(digits, p.id, p.name, p.membership_end)}
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
    </div>
  );
}
