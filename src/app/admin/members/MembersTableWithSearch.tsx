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

  return (
    <>
      <div className="mb-4">
        <label htmlFor="member-search" className="mb-1 block text-sm text-[var(--chalk-muted)]">
          검색 (성명, 이메일, 전화번호)
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
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-3 font-medium text-[var(--chalk)]">성명</th>
              <th className="p-3 font-medium text-[var(--chalk)]">이메일</th>
              <th className="p-3 font-medium text-[var(--chalk)]">전화번호</th>
              <th className="p-3 font-medium text-[var(--chalk)]">뒷4자리</th>
              <th className="p-3 font-medium text-[var(--chalk)]">회원권 시작</th>
              <th className="p-3 font-medium text-[var(--chalk)]">회원권 종료</th>
              <th className="p-3 font-medium text-[var(--chalk)]">상태</th>
              <th className="p-3 font-medium text-[var(--chalk)]">역할</th>
              <th className="p-3 font-medium text-[var(--chalk)]">동작</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)]">
                <td className="p-3 text-[var(--chalk)]">{p.name}</td>
                <td className="p-3 text-[var(--chalk-muted)]">{p.email ?? "-"}</td>
                <td className="p-3 text-[var(--chalk-muted)]">{p.phone}</td>
                <td className="p-3 text-[var(--chalk-muted)]">{p.phone_tail4}</td>
                <td className="p-3 text-[var(--chalk-muted)]">{p.membership_start ?? "-"}</td>
                <td className="p-3 text-[var(--chalk-muted)]">{p.membership_end ?? "-"}</td>
                <td className="p-3 text-[var(--chalk-muted)]">
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
                <td className="p-3 text-[var(--chalk-muted)]">{p.role}</td>
                <td className="p-3">
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
