"use client";

import { useState, useMemo } from "react";
import { formatDateTimeKST } from "@/lib/date";

type ProfileRef = { id: string; name: string; phone_tail4: string } | null;
type Row = {
  id: string;
  attended_at: string;
  checked_at: string;
  profile: ProfileRef | ProfileRef[];
};

function getProfile(row: Row): ProfileRef {
  const p = row.profile;
  if (Array.isArray(p)) return p[0] ?? null;
  return p ?? null;
}

export function AttendanceTableWithSearch({ attendances }: { attendances: Row[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return attendances;
    const lower = q.trim().toLowerCase();
    return attendances.filter((row) => {
      const profile = getProfile(row);
      return (
        row.attended_at.includes(lower) ||
        profile?.name?.toLowerCase().includes(lower) ||
        profile?.phone_tail4?.includes(lower)
      );
    });
  }, [attendances, q]);

  return (
    <>
      <div className="mb-4">
        <label htmlFor="attendance-search" className="mb-1 block text-sm text-[var(--chalk-muted)]">
          검색 (출석일자, 회원명, 전화뒷4자리)
        </label>
        <input
          id="attendance-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="검색어 입력"
          className="input-base max-w-sm"
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden -mx-4 sm:mx-0">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)] whitespace-nowrap">출석일자</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">회원명</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">전화뒷4자리</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)] whitespace-nowrap">체크 시각</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const row = a as unknown as Row;
              const profile = getProfile(row);
              return (
                <tr key={row.id} className="border-b border-[var(--border)]">
                  <td className="p-1.5 sm:p-2 text-[var(--chalk)] whitespace-nowrap">{row.attended_at}</td>
                  <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">{profile?.name ?? "-"}</td>
                  <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">{profile?.phone_tail4 ?? "-"}</td>
                  <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)] whitespace-nowrap">
                    {formatDateTimeKST(row.checked_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="mt-4 text-[var(--chalk-muted)]">
          {q.trim() ? "검색 결과가 없습니다." : "출석 기록이 없습니다."}
        </p>
      )}
    </>
  );
}
