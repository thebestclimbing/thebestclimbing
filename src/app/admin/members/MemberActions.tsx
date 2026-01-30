"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

type ProfileRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  phone_tail4: string;
  membership_start: string | null;
  membership_end: string | null;
  membership_paused?: boolean;
  membership_paused_at: number | null; // YYYYMMDD 정수
  role: string;
  created_at: string;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(isoDate: string | null, months: number): string {
  const d = isoDate ? new Date(isoDate + "T12:00:00") : new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function addDays(isoDate: string | null, days: number): string {
  const d = isoDate ? new Date(isoDate + "T12:00:00") : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(fromDate + "T12:00:00").getTime();
  const to = new Date(toDate + "T12:00:00").getTime();
  return Math.floor((to - from) / (24 * 60 * 60 * 1000));
}

function ymdToIso(ymd: number): string {
  const s = String(ymd);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function todayYmd(): number {
  return parseInt(todayISO().replace(/-/g, ""), 10);
}

/** 어제 날짜 YYYYMMDD (정지 당일을 1일로 보이게 하기 위함) */
function yesterdayYmd(): number {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return y * 10000 + m * 100 + day;
}

export function MemberActions({ profile }: { profile: ProfileRow }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"extend" | "pause" | "resume" | null>(null);
  const [error, setError] = useState("");
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendMonths, setExtendMonths] = useState<1 | 3>(1);
  const [modalStart, setModalStart] = useState("");
  const [modalEnd, setModalEnd] = useState("");

  useEffect(() => {
    if (extendModalOpen) {
      setExtendMonths(1);
      setModalStart(profile.membership_start ?? todayISO());
      setModalEnd(addMonths(profile.membership_end, 1));
    }
  }, [extendModalOpen, profile.membership_start, profile.membership_end]);

  async function saveMembershipDates() {
    setError("");
    setLoading("extend");
    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({
        membership_start: modalStart || null,
        membership_end: modalEnd || null,
        membership_paused: false,
        membership_paused_at: null,
      })
      .eq("id", profile.id);
    setLoading(null);
    if (err) {
      setError(err.message);
      return;
    }
    setExtendModalOpen(false);
    router.refresh();
  }

  function applyExtendMonths(months: 1 | 3) {
    setExtendMonths(months);
    setModalEnd(addMonths(modalEnd || profile.membership_end, months));
  }

  async function setPaused(paused: boolean) {
    setError("");
    setLoading(paused ? "pause" : "resume");
    const supabase = createClient();
    if (paused) {
      const { error: err } = await supabase
        .from("profiles")
        .update({
          membership_paused: true,
          membership_paused_at: yesterdayYmd(),
        })
        .eq("id", profile.id);
      setLoading(null);
      if (err) {
        setError(err.message);
        return;
      }
    } else {
      const pausedAtIso =
        profile.membership_paused_at != null
          ? ymdToIso(profile.membership_paused_at)
          : todayISO();
      const days = daysBetween(pausedAtIso, todayISO());
      const newEnd = addDays(profile.membership_end, days);
      const { error: err } = await supabase
        .from("profiles")
        .update({
          membership_paused: false,
          membership_paused_at: null,
          membership_end: newEnd,
        })
        .eq("id", profile.id);
      setLoading(null);
      if (err) {
        setError(err.message);
        return;
      }
    }
    router.refresh();
  }

  const isPaused = profile.membership_paused === true;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setExtendModalOpen(true)}
        disabled={!!loading}
        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--chalk)] transition hover:bg-[var(--surface-muted)] disabled:opacity-50"
      >
        연장
      </button>
      {isPaused ? (
        <button
          type="button"
          onClick={() => setPaused(false)}
          disabled={!!loading}
          className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          {loading === "resume" ? <LoadingSpinner size="sm" className="text-white" /> : "회원권 시작"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setPaused(true)}
          disabled={!!loading}
          className="rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
        >
          {loading === "pause" ? <LoadingSpinner size="sm" className="text-white" /> : "정지"}
        </button>
      )}
      {error ? <p className="mt-1 w-full text-xs text-red-500">{error}</p> : null}

      {/* 연장 모달 */}
      {extendModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden
            onClick={() => !loading && setExtendModalOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-[var(--chalk)]">회원권 연장</h3>

            <div className="mb-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--chalk-muted)]">
                  회원권 시작일
                </label>
                <input
                  type="date"
                  value={modalStart}
                  onChange={(e) => setModalStart(e.target.value)}
                  className="input-base w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--chalk)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--chalk-muted)]">
                  회원권 종료일
                </label>
                <input
                  type="date"
                  value={modalEnd}
                  onChange={(e) => setModalEnd(e.target.value)}
                  className="input-base w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--chalk)]"
                />
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="extendMonths"
                  checked={extendMonths === 1}
                  onChange={() => applyExtendMonths(1)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--chalk)]">1개월 연장</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="extendMonths"
                  checked={extendMonths === 3}
                  onChange={() => applyExtendMonths(3)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--chalk)]">3개월 연장</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setModalStart(profile.membership_start ?? todayISO());
                  setModalEnd(profile.membership_end ?? todayISO());
                }}
                disabled={!!loading}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--chalk)] transition hover:bg-[var(--surface-muted)] disabled:opacity-50"
              >
                초기화
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExtendModalOpen(false)}
                disabled={!!loading}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] py-2.5 text-sm font-medium text-[var(--chalk)] disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveMembershipDates}
                disabled={!!loading}
                className="flex-1 rounded-xl bg-[var(--primary)] py-2.5 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
              >
                {loading === "extend" ? <LoadingSpinner size="sm" className="mx-auto text-white" /> : "확인"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
