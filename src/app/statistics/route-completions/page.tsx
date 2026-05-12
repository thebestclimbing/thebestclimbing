import Link from "next/link";
import { getExerciseLogsForStatistics } from "@/lib/statistics-logs";
import { GRADE_VALUES, GRADE_DETAILS } from "@/types/database";
import { RouteCompletionsClient } from "./RouteCompletionsClient";
import type { RouteStat } from "./RouteCompletionsClient";

type RouteAccum = {
  routeId: string;
  routeName: string;
  grade: string;
  gradeValue: string;
  gradeDetail: string;
  total: number;
  memberMap: Map<string, { memberName: string; completedAt: string }>;
};

export default async function RouteCompletionsStatsPage() {
  const logsList = await getExerciseLogsForStatistics();

  const byRoute = new Map<string, RouteAccum>();
  for (const log of logsList) {
    const rid = log.route_id;
    if (!byRoute.has(rid)) {
      byRoute.set(rid, {
        routeId: rid,
        routeName: log.route?.name ?? "-",
        grade: `${log.route?.grade_value ?? ""}${log.route?.grade_detail ?? ""}`,
        gradeValue: log.route?.grade_value ?? "",
        gradeDetail: log.route?.grade_detail ?? "",
        total: 0,
        memberMap: new Map(),
      });
    }
    const r = byRoute.get(rid)!;
    r.total += 1;
    if (log.is_completed) {
      const existing = r.memberMap.get(log.profile_id);
      if (!existing || log.logged_at > existing.completedAt) {
        r.memberMap.set(log.profile_id, {
          memberName: log.profile?.name ?? "-",
          completedAt: log.logged_at,
        });
      }
    }
  }

  const stats: RouteStat[] = Array.from(byRoute.values())
    .map((r) => {
      const completedMembers = Array.from(r.memberMap.entries())
        .map(([memberId, v]) => ({ memberId, ...v }))
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
      return {
        routeId: r.routeId,
        routeName: r.routeName,
        grade: r.grade,
        gradeValue: r.gradeValue,
        gradeDetail: r.gradeDetail,
        completed: completedMembers.length,
        total: r.total,
        completedMembers,
      };
    })
    .sort((a, b) => {
      const gvDiff = GRADE_VALUES.indexOf(b.gradeValue as never) - GRADE_VALUES.indexOf(a.gradeValue as never);
      if (gvDiff !== 0) return gvDiff;
      return GRADE_DETAILS.indexOf(b.gradeDetail as never) - GRADE_DETAILS.indexOf(a.gradeDetail as never);
    });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--chalk)]">
        루트별 완등 통계
      </h1>
      <p className="mb-6 text-sm text-[var(--chalk-muted)]">
        루트별 완등 수 및 일지등록수 (높은 난이도 순) · 완등 수 클릭 시 회원 목록 확인
      </p>

      <RouteCompletionsClient stats={stats} />

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
