"use client";

import { useState, useMemo } from "react";
import { MemberActions } from "./MemberActions";

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

export function MembersTableWithSearch({ profiles }: { profiles: ProfileRow[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return profiles;
    const lower = q.trim().toLowerCase();
    return profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        (p.email ?? "").toLowerCase().includes(lower) ||
        p.phone.includes(lower) ||
        p.phone_tail4.includes(lower)
    );
  }, [profiles, q]);

  /** YYYYMMDD 정수 → 오늘까지 경과 일수 (정지 중일 때만 의미 있음) */
  function getPausedDays(ymd: number | null, isPaused: boolean): number | null {
    if (!isPaused || ymd == null) return null;
    const y = Math.floor(ymd / 10000);
    const m = Math.floor((ymd % 10000) / 100) - 1;
    const d = ymd % 100;
    const start = new Date(y, m, d);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - start.getTime();
    return Math.floor(diffMs / (24 * 60 * 60 * 1000));
  }

  return (
    <>
      <div className="mb-4">
        <label htmlFor="member-search" className="mb-1 block text-sm text-[var(--chalk-muted)]">
          검색 (성명, 전화번호)
        </label>
        <input
          id="member-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="검색어 입력"
          className="input-base max-w-sm"
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden -mx-4 sm:mx-0">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">성명</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">회원권 시작</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">회원권 종료</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">상태</th>
              <th className="hidden p-1.5 sm:table-cell sm:p-2 font-medium text-[var(--chalk)]">정지일수</th>
              <th className="p-1.5 sm:p-2 text-center font-medium text-[var(--chalk)]">회원권</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)]">
                <td className="p-1.5 sm:p-2 text-[var(--chalk)]">{p.name}</td>
                <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">{p.membership_start ?? "-"}</td>
                <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">{p.membership_end ?? "-"}</td>
                <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">
                  {p.membership_paused ? (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      정지
                    </span>
                  ) : (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800 dark:bg-green-900/40 dark:text-green-300">
                      정상
                    </span>
                  )}
                </td>
                <td className="hidden p-1.5 sm:table-cell sm:p-2 text-[var(--chalk-muted)]">
                  {(() => {
                    const days = getPausedDays(p.membership_paused_at, p.membership_paused === true);
                    return days != null ? `${days}일` : "-";
                  })()}
                </td>
                <td className="p-1.5 sm:p-2">
                  <MemberActions profile={p} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="mt-4 text-[var(--chalk-muted)]">
          {q.trim() ? "검색 결과가 없습니다." : "등록된 회원이 없습니다."}
        </p>
      )}
    </>
  );
}
