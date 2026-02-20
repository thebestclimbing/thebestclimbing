import Link from "next/link";
import { getExerciseLogsForStatistics } from "@/lib/statistics-logs";

export default async function MemberCompletionsStatsPage() {
  const logsList = await getExerciseLogsForStatistics();

  const byMember = new Map<string, { memberId: string; memberName: string; completed: number }>();
  for (const log of logsList) {
    if (!log.is_completed) continue;
    const key = log.profile_id;
    if (!byMember.has(key)) {
      byMember.set(key, {
        memberId: log.profile_id,
        memberName: log.profile?.name ?? "-",
        completed: 0,
      });
    }
    byMember.get(key)!.completed += 1;
  }
  const stats = Array.from(byMember.values()).sort((a, b) =>
    a.memberName.localeCompare(b.memberName)
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--chalk)]">
        회원별 루트 완등 통계
      </h1>
      <p className="mb-6 text-sm text-[var(--chalk-muted)]">
        회원별 완등 횟수
      </p>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden -mx-4 sm:mx-0">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">회원명</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">완등 횟수</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.memberId} className="border-b border-[var(--border)]">
                <td className="p-1.5 sm:p-2 text-[var(--chalk)]">{s.memberName}</td>
                <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">{s.completed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {stats.length === 0 && (
        <p className="mt-2 text-[var(--chalk-muted)]">데이터 없음</p>
      )}

      <p className="mt-6">
        <Link
          href="/statistics"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          통계 목록
        </Link>
      </p>
    </div>
  );
}
