import Link from "next/link";
import { getExerciseLogsForStatistics } from "@/lib/statistics-logs";
import { MemberCompletionsClient } from "./MemberCompletionsClient";
import type { MemberStat } from "./MemberCompletionsClient";

export default async function MemberCompletionsStatsPage() {
  const logsList = await getExerciseLogsForStatistics();

  const byMember = new Map<string, MemberStat>();
  for (const log of logsList) {
    if (!log.is_completed) continue;
    const key = log.profile_id;
    if (!byMember.has(key)) {
      byMember.set(key, {
        memberId: log.profile_id,
        memberName: log.profile?.name ?? "-",
        completed: 0,
        completedRoutes: [],
      });
    }
    const entry = byMember.get(key)!;
    entry.completed += 1;
    entry.completedRoutes.push({
      routeId: log.route_id,
      routeName: log.route?.name ?? "-",
      wallType: log.route?.wall_type ?? "-",
      gradeValue: log.route?.grade_value ?? "",
      gradeDetail: log.route?.grade_detail ?? "",
    });
  }

  const stats = Array.from(byMember.values()).sort((a, b) => b.completed - a.completed);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--chalk)]">
        회원별 루트 완등 통계
      </h1>
      <p className="mb-6 text-sm text-[var(--chalk-muted)]">
        회원별 완등 횟수 (높은 순) · 완등 횟수 클릭 시 목록 확인
      </p>

      <MemberCompletionsClient stats={stats} />

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
