"use client";

import { useState, useEffect } from "react";

type CompletedMember = {
  memberId: string;
  memberName: string;
  completedAt: string;
};

export type RouteStat = {
  routeId: string;
  routeName: string;
  grade: string;
  gradeValue: string;
  gradeDetail: string;
  completed: number;
  total: number;
  completedMembers: CompletedMember[];
};

export function RouteCompletionsClient({ stats }: { stats: RouteStat[] }) {
  const [modal, setModal] = useState<RouteStat | null>(null);

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
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">루트명</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">난이도</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">완등 수</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">일지등록수</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.routeId} className="border-b border-[var(--border)]">
                <td className="p-1.5 sm:p-2 text-[var(--chalk)]">{s.routeName}</td>
                <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">{s.grade}</td>
                <td className="p-1.5 sm:p-2">
                  <button
                    onClick={() => setModal(s)}
                    className="font-medium text-[var(--primary)] underline hover:opacity-70"
                  >
                    {s.completed}
                  </button>
                </td>
                <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">{s.total}</td>
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
            className="w-full max-w-sm rounded-2xl bg-[var(--surface)] p-5 shadow-xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--chalk)]">
                {modal.routeName} 완등 회원 ({modal.completed}명)
              </h2>
              <button
                onClick={() => setModal(null)}
                className="text-[var(--chalk-muted)] hover:text-[var(--chalk)] text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain flex-1">
              {modal.completedMembers.length === 0 ? (
                <p className="text-sm text-[var(--chalk-muted)]">완등 회원 없음</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-[var(--surface)]">
                    <tr className="border-b border-[var(--border)]">
                      <th className="pb-2 pr-3 font-medium text-[var(--chalk-muted)]">회원명</th>
                      <th className="pb-2 font-medium text-[var(--chalk-muted)]">완등일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modal.completedMembers.map((m, i) => (
                      <tr key={`${m.memberId}-${i}`} className="border-b border-[var(--border)]">
                        <td className="py-1.5 pr-3 text-[var(--chalk)]">{m.memberName}</td>
                        <td className="py-1.5 text-[var(--chalk-muted)]">{m.completedAt.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
