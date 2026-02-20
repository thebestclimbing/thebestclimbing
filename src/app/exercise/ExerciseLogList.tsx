"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WALL_TYPE_LABELS, formatGrade } from "@/types/database";
import type { GradeDetail, GradeValue } from "@/types/database";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface LogItem {
  id: string;
  progress_hold_count: number;
  attempt_count: number;
  is_completed: boolean;
  completion_requested: boolean;
  is_round_trip: boolean;
  round_trip_count: number;
  logged_at: string;
  memo: string | null;
  route: {
    id: string;
    wall_type: string;
    grade_value: GradeValue;
    grade_detail: GradeDetail;
    name: string;
    hold_count: number;
  };
}

export default function ExerciseLogList({
  logs,
  profileId,
  completedRouteIdToDate = {},
  readOnly = false,
}: {
  logs: LogItem[];
  profileId: string;
  /** 루트별 완등 인증일 — 이 날짜 이후 기록에만 '완등 인증됨' 표시 */
  completedRouteIdToDate?: Record<string, string>;
  /** true면 메모·완등인증 버튼 숨김 (다른 회원 조회 시) */
  readOnly?: boolean;
}) {
  const PAGE_SIZE = 20;

  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [memoLogId, setMemoLogId] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState("");
  const [savingMemoId, setSavingMemoId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const lower = search.trim().toLowerCase();
    return logs.filter(
      (log) =>
        log.route.name.toLowerCase().includes(lower) ||
        log.logged_at.includes(lower)
    );
  }, [logs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  async function requestCompletion(logId: string) {
    setRequestingId(logId);
    const supabase = createClient();
    await supabase
      .from("exercise_logs")
      .update({ completion_requested: true })
      .eq("id", logId)
      .eq("profile_id", profileId);
    setRequestingId(null);
    router.refresh();
  }

  function openMemoModal(log: LogItem) {
    setMemoLogId(log.id);
    setMemoDraft(log.memo ?? "");
  }

  function closeMemoModal() {
    setMemoLogId(null);
    setMemoDraft("");
    setSavingMemoId(null);
  }

  async function saveMemo() {
    if (!memoLogId) return;
    setSavingMemoId(memoLogId);
    const supabase = createClient();
    await supabase
      .from("exercise_logs")
      .update({ memo: memoDraft.trim() || null })
      .eq("id", memoLogId)
      .eq("profile_id", profileId);
    setSavingMemoId(null);
    closeMemoModal();
    router.refresh();
  }

  if (logs.length === 0) {
    return (
      <p className="card rounded-2xl p-6 text-[var(--chalk-muted)]">
        기록이 없습니다.
      </p>
    );
  }

  return (
    <>
      <div className="mb-4">
        <label htmlFor="log-search" className="mb-1 block text-sm text-[var(--chalk-muted)]">
          검색 (루트명, 날짜)
        </label>
        <input
          id="log-search"
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="검색어 입력"
          className="input-base max-w-sm"
        />
      </div>
      <ul className="flex flex-col gap-2">
        {paginated.map((log) => {
          const wallLabel =
            WALL_TYPE_LABELS[log.route.wall_type as keyof typeof WALL_TYPE_LABELS] ??
            log.route.wall_type;
          const grade = formatGrade(log.route.grade_value, log.route.grade_detail);
          const certDate = completedRouteIdToDate[log.route.id];
          const showCompletedBadge =
            log.is_completed || (!!certDate && log.logged_at >= certDate);
          const completedCertDate = showCompletedBadge
            ? (log.is_completed ? log.logged_at : certDate ?? "")
            : "";
          const canRequest =
            !showCompletedBadge &&
            !log.is_completed &&
            !log.completion_requested &&
            log.route.hold_count === log.progress_hold_count &&
            log.attempt_count === 1;
          return (
            <li key={log.id} className="card rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link href={`/exercise/${log.id}`} className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-[var(--chalk-muted)]">{log.logged_at}</span>
                    <span className="text-[var(--chalk-muted)]">{wallLabel}</span>
                    <span className="font-medium text-[var(--chalk)]">
                      {log.route.name}
                    </span>
                    <span className="text-[var(--chalk-muted)]">{grade}</span>
                    {showCompletedBadge && (
                      <span className="rounded border border-[var(--border)] bg-white px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-green-400">
                        ✓ 완등 인증됨
                        {completedCertDate && (
                          <span className="ml-1 font-normal text-green-600 dark:text-green-500">
                            ({completedCertDate})
                          </span>
                        )}
                      </span>
                    )}
                    {log.completion_requested && !log.is_completed && (
                      <span className="rounded border border-[var(--border)] bg-white px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-amber-400">
                        인증 대기 중
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-[var(--chalk-muted)]">
                    홀드 {log.progress_hold_count}/{log.route.hold_count} · 시도{" "}
                    {log.attempt_count}회
                    {log.is_round_trip && ` · 왕복 ${log.round_trip_count}회`}
                  </div>
                </Link>
                {!readOnly && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openMemoModal(log)}
                      className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--chalk)] shadow-sm transition hover:bg-[var(--surface-muted)] active:scale-[0.98] dark:bg-[var(--surface)]"
                      title="메모"
                    >
                      메모{log.memo ? " ✓" : ""}
                    </button>
                    {canRequest && (
                      <button
                        type="button"
                        onClick={() => requestCompletion(log.id)}
                        disabled={!!requestingId}
                        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--chalk)] shadow-sm transition hover:bg-[var(--surface-muted)] active:scale-[0.98] disabled:opacity-50 dark:bg-[var(--surface)]"
                      >
                        {requestingId === log.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          "완등인증요청"
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 && (
        <p className="text-[var(--chalk-muted)]">검색 결과가 없습니다.</p>
      )}
      {filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
          <p className="text-sm text-[var(--chalk-muted)]">
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} / 총 {filtered.length}건
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--chalk)] disabled:opacity-40 disabled:pointer-events-none hover:bg-[var(--surface-muted)]"
            >
              이전
            </button>
            <span className="text-sm text-[var(--chalk-muted)]">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--chalk)] disabled:opacity-40 disabled:pointer-events-none hover:bg-[var(--surface-muted)]"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {memoLogId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memo-dialog-title"
          onClick={closeMemoModal}
        >
          <div
            className="card w-full max-w-md rounded-2xl p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="memo-dialog-title" className="mb-3 text-sm font-semibold text-[var(--chalk)]">
              메모
            </h2>
            <textarea
              value={memoDraft}
              onChange={(e) => setMemoDraft(e.target.value)}
              placeholder="이 일지에 대한 메모를 입력하세요"
              rows={4}
              className="input-base mb-4 w-full resize-y"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeMemoModal}
                className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--chalk)] hover:bg-[var(--surface-muted)] dark:bg-[var(--surface)]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveMemo}
                disabled={!!savingMemoId}
                className="rounded-lg bg-[var(--chalk)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {savingMemoId ? <LoadingSpinner size="sm" /> : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
