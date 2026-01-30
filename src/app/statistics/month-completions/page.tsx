import Link from "next/link";
import { getExerciseLogsForStatistics } from "@/lib/statistics-logs";

export default async function MonthCompletionsStatsPage() {
  const logsList = await getExerciseLogsForStatistics();

  const byMonthCompleted = new Map<string, { total: number; completed: number }>();
  for (const log of logsList) {
    const month = log.logged_at.slice(0, 7);
    if (!byMonthCompleted.has(month)) {
      byMonthCompleted.set(month, { total: 0, completed: 0 });
    }
    const m = byMonthCompleted.get(month)!;
    m.total += 1;
    if (log.is_completed) m.completed += 1;
  }
  const stats = Array.from(byMonthCompleted.entries())
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--chalk)]">
        기간별 완등 통계 (월별)
      </h1>
      <p className="mb-6 text-sm text-[var(--chalk-muted)]">
        월별 완등 수 및 전체 기록 수 (최근 12개월)
      </p>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden -mx-4 sm:mx-0">
        <table className="w-full min-w-[240px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">기간(월)</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">완등 수</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">전체 기록 수</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.month} className="border-b border-[var(--border)]">
                <td className="p-1.5 sm:p-2 text-[var(--chalk)]">{s.month}</td>
                <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">{s.completed}</td>
                <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">{s.total}</td>
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
