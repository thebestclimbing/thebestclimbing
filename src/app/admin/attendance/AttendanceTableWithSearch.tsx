"use client";

import { useState, useMemo } from "react";
import { formatDateTimeKST, getTodayISOKST } from "@/lib/date";

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

const PAGE_SIZE = 20;

export function AttendanceTableWithSearch({ attendances }: { attendances: Row[] }) {
  const [q, setQ] = useState("");
  const [dateFilter, setDateFilter] = useState(() => getTodayISOKST());
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = attendances;
    if (dateFilter) {
      list = list.filter((row) => row.attended_at === dateFilter);
    }
    if (!q.trim()) return list;
    const lower = q.trim().toLowerCase();
    return list.filter((row) => {
      const profile = getProfile(row);
      return (
        row.attended_at.includes(lower) ||
        profile?.name?.toLowerCase().includes(lower) ||
        profile?.phone_tail4?.includes(lower)
      );
    });
  }, [attendances, dateFilter, q]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="attendance-date" className="mb-1 block text-sm text-[var(--chalk-muted)]">
            날짜별 검색
          </label>
          <div className="flex items-center gap-2">
            <input
              id="attendance-date"
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="input-base max-w-[180px]"
            />
            <button
              type="button"
              onClick={() => {
                setDateFilter("");
                setPage(1);
              }}
              title="날짜 초기화"
              aria-label="날짜 초기화"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--chalk-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--chalk)] disabled:opacity-40 disabled:pointer-events-none"
              disabled={!dateFilter}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                <path d="M22 21H7" />
                <path d="m5 11 9 9" />
              </svg>
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="attendance-search" className="mb-1 block text-sm text-[var(--chalk-muted)]">
            검색 (회원명, 전화뒷4자리)
          </label>
          <input
            id="attendance-search"
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="검색어 입력"
            className="input-base max-w-sm"
          />
        </div>
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
            {paginated.map((a) => {
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
          {dateFilter || q.trim()
            ? "검색 결과가 없습니다."
            : "출석 기록이 없습니다."}
        </p>
      )}
      {filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
          <p className="text-sm text-[var(--chalk-muted)]">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / 총 {filtered.length}건
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrev}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--chalk)] disabled:opacity-40 disabled:pointer-events-none hover:bg-[var(--surface-muted)]"
            >
              이전
            </button>
            <span className="text-sm text-[var(--chalk-muted)]">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={!hasNext}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--chalk)] disabled:opacity-40 disabled:pointer-events-none hover:bg-[var(--surface-muted)]"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </>
  );
}
