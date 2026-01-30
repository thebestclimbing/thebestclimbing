import Link from "next/link";
import { getExerciseLogsForStatistics } from "@/lib/statistics-logs";

export default async function RouteCompletionsStatsPage() {
  const logsList = await getExerciseLogsForStatistics();

  const byRouteCompleted = new Map<string, { name: string; completed: number; total: number }>();
  for (const log of logsList) {
    const rid = log.route_id;
    if (!byRouteCompleted.has(rid)) {
      byRouteCompleted.set(rid, {
        name: log.route.name,
        completed: 0,
        total: 0,
      });
    }
    const r = byRouteCompleted.get(rid)!;
    r.total += 1;
    if (log.is_completed) r.completed += 1;
  }
  const stats = Array.from(byRouteCompleted.entries()).map(([id, v]) => ({
    routeId: id,
    routeName: v.name,
    completed: v.completed,
    total: v.total,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--chalk)]">
        루트별 완등 통계
      </h1>
      <p className="mb-6 text-sm text-[var(--chalk-muted)]">
        루트별 완등 수 및 전체 기록 수
      </p>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden -mx-4 sm:mx-0">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">루트명</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">완등 수</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">전체 기록 수</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.routeId} className="border-b border-[var(--border)]">
                <td className="p-1.5 sm:p-2 text-[var(--chalk)]">{s.routeName}</td>
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
