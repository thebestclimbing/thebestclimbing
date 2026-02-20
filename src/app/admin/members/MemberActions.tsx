"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { deleteMember } from "./actions";
import { formatDateKST } from "@/lib/date";

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

/** 회원권이 이미 만료되었는지 (종료일 없거나 오늘 > 종료일) */
function isMembershipExpired(membershipEnd: string | null): boolean {
  if (!membershipEnd) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(membershipEnd + "T12:00:00");
  end.setHours(0, 0, 0, 0);
  return today > end;
}

/** 연장 모달용 종료일 계산: 미만료면 기존 종료일+연장개월, 만료됐으면 오늘+연장개월 */
function getExtendedEndDate(membershipEnd: string | null, extendMonths: number): string {
  const today = todayISO();
  if (isMembershipExpired(membershipEnd)) return addMonths(today, extendMonths);
  return addMonths(membershipEnd, extendMonths);
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

export function MemberActions({
  profile,
  currentUserId,
}: {
  profile: ProfileRow;
  currentUserId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"extend" | "pause" | "resume" | "delete" | null>(null);
  const [error, setError] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const canDelete = currentUserId != null && profile.id !== currentUserId;
  const [extendMonths, setExtendMonths] = useState<1 | 3>(1);
  const [modalStart, setModalStart] = useState("");
  const [modalEnd, setModalEnd] = useState("");

  useEffect(() => {
    if (extendModalOpen) {
      setExtendMonths(1);
      setModalStart(todayISO());
      setModalEnd(getExtendedEndDate(profile.membership_end, 1));
    }
  }, [extendModalOpen, profile.membership_end]);

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
    setModalStart(todayISO());
    setModalEnd(getExtendedEndDate(profile.membership_end, months));
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
        onClick={() => setDetailModalOpen(true)}
        disabled={!!loading}
        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--chalk)] transition hover:bg-[var(--surface-muted)] disabled:opacity-50"
      >
        상세
      </button>
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
          {loading === "resume" ? <LoadingSpinner size="sm" className="text-white" /> : "시작"}
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

      {/* 회원상세 모달 */}
      {detailModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden
            onClick={() => !loading && setDetailModalOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(90vw,400px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--chalk)]">회원 상세</h3>
              <button
                type="button"
                onClick={() => !loading && setDetailModalOpen(false)}
                className="rounded-full p-1.5 text-[var(--chalk-muted)] hover:bg-[var(--surface-muted)]"
                aria-label="닫기"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-[var(--chalk-muted)]">성명</dt>
                <dd className="mt-0.5 text-[var(--chalk)]">{profile.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--chalk-muted)]">이메일</dt>
                <dd className="mt-0.5 text-[var(--chalk)]">{profile.email ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--chalk-muted)]">전화번호</dt>
                <dd className="mt-0.5 text-[var(--chalk)]">{profile.phone}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--chalk-muted)]">전화번호 뒤 4자리</dt>
                <dd className="mt-0.5 text-[var(--chalk)]">{profile.phone_tail4}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--chalk-muted)]">회원권 시작</dt>
                <dd className="mt-0.5 text-[var(--chalk)]">{profile.membership_start ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--chalk-muted)]">회원권 종료</dt>
                <dd className="mt-0.5 text-[var(--chalk)]">{profile.membership_end ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--chalk-muted)]">상태</dt>
                <dd className="mt-0.5">
                  {profile.membership_paused ? (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      정지
                    </span>
                  ) : (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800 dark:bg-green-900/40 dark:text-green-300">
                      정상
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--chalk-muted)]">역할</dt>
                <dd className="mt-0.5 text-[var(--chalk)]">{profile.role}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--chalk-muted)]">가입일</dt>
                <dd className="mt-0.5 text-[var(--chalk)]">{formatDateKST(profile.created_at)}</dd>
              </div>
            </dl>
            <div className="mt-6 flex gap-2 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => !loading && setDetailModalOpen(false)}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] py-2.5 text-sm font-medium text-[var(--chalk)] disabled:opacity-50"
              >
                닫기
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    setDeleteModalOpen(true);
                  }}
                  disabled={!!loading}
                  className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        </>
      )}

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

            <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5">
              <p className="mb-1.5 text-xs font-medium text-[var(--chalk-muted)]">기존 저장된 회원권</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-[var(--chalk-muted)]">시작일</dt>
                <dd className="text-[var(--chalk)]">{profile.membership_start ?? "-"}</dd>
                <dt className="text-[var(--chalk-muted)]">종료일</dt>
                <dd className="text-[var(--chalk)]">{profile.membership_end ?? "-"}</dd>
              </dl>
            </div>

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
                  setModalStart(todayISO());
                  setModalEnd(getExtendedEndDate(profile.membership_end, extendMonths));
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

      {/* 회원 삭제 확인 모달 */}
      {deleteModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden
            onClick={() => !loading && setDeleteModalOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,320px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-[var(--chalk)]">회원 삭제</h3>
            <p className="mb-4 text-sm text-[var(--chalk-muted)]">
              <strong className="text-[var(--chalk)]">{profile.name}</strong> 회원을 삭제하시겠습니까? 로그인 계정과 프로필·출석·운동일지 등 관련 데이터가 모두 삭제되며 복구할 수 없습니다.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={!!loading}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] py-2.5 text-sm font-medium text-[var(--chalk)] disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  setError("");
                  setLoading("delete");
                  try {
                    const result = await deleteMember(profile.id);
                    if (result.ok) {
                      setDeleteModalOpen(false);
                      router.refresh();
                    } else {
                      setError(result.error);
                    }
                  } finally {
                    setLoading(null);
                  }
                }}
                disabled={!!loading}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {loading === "delete" ? <LoadingSpinner size="sm" className="mx-auto text-white" /> : "삭제"}
              </button>
            </div>
            {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}
          </div>
        </>
      )}
    </div>
  );
}
