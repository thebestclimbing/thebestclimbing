"use client";

import { useState, useEffect } from "react";
import { WALL_TYPE_LABELS } from "@/types/database";
import type { WallType } from "@/types/database";

type CompletedRoute = {
  routeId: string;
  routeName: string;
  wallType: string;
  gradeValue: string;
  gradeDetail: string;
};

export type MemberStat = {
  memberId: string;
  memberName: string;
  completed: number;
  completedRoutes: CompletedRoute[];
};

export function MemberCompletionsClient({ stats }: { stats: MemberStat[] }) {
  const [modal, setModal] = useState<MemberStat | null>(null);

  useEffect(() => {
    if (modal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modal]);

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden -mx-4 sm:mx-0">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">순위</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">회원명</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">완등 횟수</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr key={s.memberId} className="border-b border-[var(--border)]">
                <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">{i + 1}</td>
                <td className="p-1.5 sm:p-2 text-[var(--chalk)]">{s.memberName}</td>
                <td className="p-1.5 sm:p-2">
                  <button
                    onClick={() => setModal(s)}
                    className="font-medium text-[var(--primary)] underline hover:opacity-70"
                  >
                    {s.completed}회
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-5 shadow-xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--chalk)]">
                {modal.memberName}의 완등 목록 ({modal.completed}회)
              </h2>
              <button
                onClick={() => setModal(null)}
                className="text-[var(--chalk-muted)] hover:text-[var(--chalk)] text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain flex-1">
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-[var(--surface)]">
                  <tr className="border-b border-[var(--border)]">
                    <th className="pb-2 pr-3 font-medium text-[var(--chalk-muted)]">루트명</th>
                    <th className="pb-2 pr-3 font-medium text-[var(--chalk-muted)]">벽</th>
                    <th className="pb-2 font-medium text-[var(--chalk-muted)]">난이도</th>
                  </tr>
                </thead>
                <tbody>
                  {modal.completedRoutes.map((r, i) => (
                    <tr key={`${r.routeId}-${i}`} className="border-b border-[var(--border)]">
                      <td className="py-1.5 pr-3 text-[var(--chalk)]">{r.routeName}</td>
                      <td className="py-1.5 pr-3 text-[var(--chalk-muted)]">{WALL_TYPE_LABELS[r.wallType as WallType] ?? r.wallType}</td>
                      <td className="py-1.5 text-[var(--chalk-muted)]">{r.gradeValue}{r.gradeDetail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
