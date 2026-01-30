import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WALL_TYPE_LABELS, formatGrade } from "@/types/database";
import type { GradeDetail, GradeValue } from "@/types/database";

export default async function StatisticsPage() {
  const supabase = await createClient();

  const { data: logsRaw } = await supabase
    .from("exercise_logs")
    .select(
      `
      id,
      profile_id,
      route_id,
      progress_hold_count,
      is_completed,
      logged_at,
      route:routes(id, name, wall_type, grade_value, grade_detail, hold_count),
      profile:profiles(id, name)
    `
    );

  type LogRow = {
    id: string;
    profile_id: string;
    route_id: string;
    progress_hold_count: number;
    is_completed: boolean;
    logged_at: string;
    route: {
      id: string;
      name: string;
      wall_type: string;
      grade_value: GradeValue;
      grade_detail: GradeDetail;
      hold_count: number;
    };
    profile: { id: string; name: string } | null;
  };
  const logsList = ((logsRaw ?? []) as unknown as Array<LogRow & { route: LogRow["route"] | LogRow["route"][]; profile: LogRow["profile"] | NonNullable<LogRow["profile"]>[] }>).map((r) => ({
    ...r,
    route: Array.isArray(r.route) ? r.route[0] : r.route,
    profile: Array.isArray(r.profile) ? r.profile[0] ?? null : r.profile,
  })) as LogRow[];

  // 1. 회원별 운동일지에 등록한 루트 통계
  const byMember = new Map<string, { name: string; routeIds: Set<string> }>();
  for (const log of logsList) {
    const pid = log.profile_id;
    if (!byMember.has(pid)) {
      byMember.set(pid, {
        name: log.profile?.name ?? "-",
        routeIds: new Set(),
      });
    }
    byMember.get(pid)!.routeIds.add(log.route_id);
  }
  const memberStats = Array.from(byMember.entries()).map(([id, v]) => ({
    memberId: id,
    memberName: v.name,
    routeCount: v.routeIds.size,
  }));

  // 2. 루트별 평균 진행한 홀드수
  const byRouteHold = new Map<
    string,
    { name: string; grades: string[]; holds: number[] }
  >();
  for (const log of logsList) {
    const rid = log.route_id;
    if (!byRouteHold.has(rid)) {
      byRouteHold.set(rid, {
        name: log.route.name,
        grades: [
          formatGrade(log.route.grade_value, log.route.grade_detail),
        ],
        holds: [],
      });
    }
    const r = byRouteHold.get(rid)!;
    r.holds.push(log.progress_hold_count);
  }
  const routeHoldStats = Array.from(byRouteHold.entries()).map(
    ([id, v]) => ({
      routeId: id,
      routeName: v.name,
      avgHold:
        v.holds.length > 0
          ? (v.holds.reduce((a, b) => a + b, 0) / v.holds.length).toFixed(1)
          : "-",
      count: v.holds.length,
    })
  );

  // 3. 루트별 완등 통계
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
  const routeCompleteStats = Array.from(byRouteCompleted.entries()).map(
    ([id, v]) => ({
      routeId: id,
      routeName: v.name,
      completed: v.completed,
      total: v.total,
    })
  );

  // 4. 기간별 운동일지에 등록한 루트 통계 (월별 - 기록 수)
  const byMonthLogs = new Map<string, number>();
  for (const log of logsList) {
    const month = log.logged_at.slice(0, 7);
    byMonthLogs.set(month, (byMonthLogs.get(month) ?? 0) + 1);
  }
  const monthRouteStats = Array.from(byMonthLogs.entries())
    .map(([month, logCount]) => ({ month, logCount }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12);

  // 5. 기간별 완등 통계 (월별)
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
  const monthCompleteStats = Array.from(byMonthCompleted.entries())
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        통계
      </h1>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          1. 회원별 운동일지에 등록한 루트 통계
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                  회원명
                </th>
                <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                  등록 루트 수
                </th>
              </tr>
            </thead>
            <tbody>
              {memberStats.map((s) => (
                <tr
                  key={s.memberId}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="p-3 text-zinc-900 dark:text-zinc-50">
                    {s.memberName}
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {s.routeCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {memberStats.length === 0 && (
          <p className="mt-2 text-zinc-500">데이터 없음</p>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          2. 루트별 평균 진행한 홀드수 통계
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                  루트명
                </th>
                <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                  평균 진행 홀드수
                </th>
                <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                  기록 수
                </th>
              </tr>
            </thead>
            <tbody>
              {routeHoldStats.map((s) => (
                <tr
                  key={s.routeId}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="p-3 text-zinc-900 dark:text-zinc-50">
                    {s.routeName}
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {s.avgHold}
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {s.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {routeHoldStats.length === 0 && (
          <p className="mt-2 text-zinc-500">데이터 없음</p>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          3. 루트별 완등 통계
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                  루트명
                </th>
                <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                  완등 수
                </th>
                <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                  전체 기록 수
                </th>
              </tr>
            </thead>
            <tbody>
              {routeCompleteStats.map((s) => (
                <tr
                  key={s.routeId}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="p-3 text-zinc-900 dark:text-zinc-50">
                    {s.routeName}
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {s.completed}
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {s.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {routeCompleteStats.length === 0 && (
          <p className="mt-2 text-zinc-500">데이터 없음</p>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          4. 기간별 운동일지에 등록한 루트 통계 (월별)
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                  기간(월)
                </th>
                <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                  기록 수
                </th>
              </tr>
            </thead>
            <tbody>
              {monthRouteStats.map((s) => (
                <tr
                  key={s.month}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="p-3 text-zinc-900 dark:text-zinc-50">
                    {s.month}
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {s.logCount}건
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {monthRouteStats.length === 0 && (
          <p className="mt-2 text-zinc-500">데이터 없음</p>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          5. 기간별 완등 통계 (월별)
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                  기간(월)
                </th>
                <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                  완등 수
                </th>
                <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                  전체 기록 수
                </th>
              </tr>
            </thead>
            <tbody>
              {monthCompleteStats.map((s) => (
                <tr
                  key={s.month}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="p-3 text-zinc-900 dark:text-zinc-50">
                    {s.month}
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {s.completed}
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {s.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {monthCompleteStats.length === 0 && (
          <p className="mt-2 text-zinc-500">데이터 없음</p>
        )}
      </section>

      <p className="mt-6">
        <Link
          href="/"
          className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          메인으로
        </Link>
      </p>
    </div>
  );
}
