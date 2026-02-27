"use client";

import { useState } from "react";
import { formatGrade } from "@/types/database";
import type { GradeValue, GradeDetail } from "@/types/database";

type Leader = { rank: number; name: string; point: number; id?: string };
type RouteItem = {
  name: string;
  rank_point: number | null;
  grade_value: string | null;
  grade_detail: string | null;
};

export function RankingTableWithModal({
  leaders,
}: {
  leaders: Leader[];
}) {
  const [modal, setModal] = useState<{
    memberName: string;
    routes: RouteItem[];
    loading: boolean;
  } | null>(null);

  async function handleScoreClick(leader: Leader) {
    if (!leader.id) return;
    setModal({
      memberName: leader.name,
      routes: [],
      loading: true,
    });
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(leader.id)}/completed-routes`);
      const data = await res.json().catch(() => ({}));
      const routes = Array.isArray(data?.routes) ? data.routes : [];
      setModal((m) => (m ? { ...m, routes, loading: false } : null));
    } catch {
      setModal((m) => (m ? { ...m, routes: [], loading: false } : null));
    }
  }

  function closeModal() {
    setModal(null);
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden -mx-4 sm:mx-0">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-3 sm:p-4 font-medium text-[var(--chalk)]">순위</th>
              <th className="p-3 sm:p-4 font-medium text-[var(--chalk)]">회원명</th>
              <th className="p-3 sm:p-4 font-medium text-[var(--chalk)] text-right">점수</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((l, i) => (
              <tr key={l.id ?? `${l.rank}-${l.name}-${i}`} className="border-b border-[var(--border)] last:border-b-0">
                <td className="p-3 sm:p-4">
                  <span className="font-semibold text-[var(--primary)]">{l.rank}위</span>
                </td>
                <td className="p-3 sm:p-4 font-medium text-[var(--chalk)]">{l.name}</td>
                <td className="p-3 sm:p-4 text-right">
                  {l.id != null ? (
                    <button
                      type="button"
                      onClick={() => handleScoreClick(l)}
                      className="text-[var(--chalk-muted)] underline hover:text-[var(--primary)] focus:outline-none focus:underline"
                    >
                      {l.point}점
                    </button>
                  ) : (
                    <span className="text-[var(--chalk-muted)]">{l.point}점</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          aria-modal="true"
          role="dialog"
          aria-labelledby="completed-routes-title"
          onClick={closeModal}
        >
          <div
            className="bg-[var(--surface)] rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
              <h2 id="completed-routes-title" className="text-lg font-semibold text-[var(--chalk)]">
                {modal.memberName} · 완등한 문제
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-[var(--chalk-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--chalk)] focus:outline-none"
                aria-label="닫기"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              {modal.loading ? (
                <p className="text-sm text-[var(--chalk-muted)]">불러오는 중...</p>
              ) : modal.routes.length === 0 ? (
                <p className="text-sm text-[var(--chalk-muted)]">완등한 문제가 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {modal.routes.map((r, i) => {
                    const grade =
                      r.grade_value && r.grade_detail
                        ? formatGrade(r.grade_value as GradeValue, r.grade_detail as GradeDetail)
                        : "";
                    return (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-lg bg-[var(--surface-muted)]/50 px-3 py-2 text-sm"
                      >
                        <span>
                          <span className="font-medium text-[var(--chalk)]">{r.name}</span>
                          {grade && (
                            <span className="text-[var(--chalk-muted)]"> {grade}</span>
                          )}
                        </span>
                        <span className="shrink-0 text-[var(--chalk-muted)]">
                          {r.rank_point != null ? `${r.rank_point}점` : "-"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
