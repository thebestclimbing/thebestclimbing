import Link from "next/link";
import { getExerciseLogsForStatistics } from "@/lib/statistics-logs";

export default async function MemberRoutesStatsPage() {
  const logsList = await getExerciseLogsForStatistics();

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--chalk)]">
        회원별 운동일지에 등록한 루트 통계
      </h1>
      <p className="mb-6 text-sm text-[var(--chalk-muted)]">
        운동일지 항목을 기준으로 회원별 등록 루트 수
      </p>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden -mx-4 sm:mx-0">
        <table className="w-full min-w-[240px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">회원명</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">등록 루트 수</th>
            </tr>
          </thead>
          <tbody>
            {memberStats.map((s) => (
              <tr key={s.memberId} className="border-b border-[var(--border)]">
                <td className="p-1.5 sm:p-2 text-[var(--chalk)]">{s.memberName}</td>
                <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">{s.routeCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {memberStats.length === 0 && (
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
