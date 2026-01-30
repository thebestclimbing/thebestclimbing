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
}: {
  logs: LogItem[];
  profileId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const lower = search.trim().toLowerCase();
    return logs.filter(
      (log) =>
        log.route.name.toLowerCase().includes(lower) ||
        log.logged_at.includes(lower)
    );
  }, [logs, search]);

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
          onChange={(e) => setSearch(e.target.value)}
          placeholder="검색어 입력"
          className="input-base max-w-sm"
        />
      </div>
      <ul className="flex flex-col gap-2">
        {filtered.map((log) => {
          const wallLabel =
            WALL_TYPE_LABELS[log.route.wall_type as keyof typeof WALL_TYPE_LABELS] ??
            log.route.wall_type;
          const grade = formatGrade(log.route.grade_value, log.route.grade_detail);
          const canRequest = !log.is_completed && !log.completion_requested;
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
                    <span className="text-[var(--chalk-muted)]">난이도 {grade}</span>
                    {log.is_completed && (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        완등
                      </span>
                    )}
                    {log.completion_requested && !log.is_completed && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        완등요청됨
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-[var(--chalk-muted)]">
                    홀드 {log.progress_hold_count}/{log.route.hold_count} · 시도{" "}
                    {log.attempt_count}회
                    {log.is_round_trip && ` · 왕복 ${log.round_trip_count}회`}
                  </div>
                </Link>
                {canRequest && (
                  <button
                    type="button"
                    onClick={() => requestCompletion(log.id)}
                    disabled={!!requestingId}
                    className="shrink-0 rounded-lg border border-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary)] transition hover:bg-[var(--primary-muted)] disabled:opacity-50"
                  >
                    {requestingId === log.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      "완등요청"
                    )}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 && (
        <p className="text-[var(--chalk-muted)]">검색 결과가 없습니다.</p>
      )}
    </>
  );
}
