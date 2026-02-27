import { createAdminClient } from "@/lib/supabase/admin";

export type RankPointLeader = { rank: number; name: string; point: number; id?: string };

/** 프로필별 랭크포인트 합계(루트당 1회) 전체 목록 생성, 동점 공동순위 적용 */
async function getFullRankingList(supabase: ReturnType<typeof createAdminClient>): Promise<RankPointLeader[]> {
  const [{ data: profiles }, { data: logs }] = await Promise.all([
    supabase.from("profiles").select("id, name").order("name"),
    supabase
      .from("exercise_logs")
      .select("profile_id, route_id, logged_at, route:routes(rank_point)")
      .eq("is_completed", true)
      .order("logged_at", { ascending: true }),
  ]);

  const sumByProfile: Record<string, number> = {};
  const routeSeenByProfile: Record<string, Set<string>> = {};

  for (const row of logs ?? []) {
    const profileId = row.profile_id as string;
    const routeId = row.route_id as string;
    const route = Array.isArray(row.route) ? row.route[0] : row.route;
    const point = route?.rank_point;
    if (point == null || typeof point !== "number") continue;

    if (!routeSeenByProfile[profileId]) routeSeenByProfile[profileId] = new Set();
    if (routeSeenByProfile[profileId].has(routeId)) continue;
    routeSeenByProfile[profileId].add(routeId);
    sumByProfile[profileId] = (sumByProfile[profileId] ?? 0) + point;
  }

  const withPoints = (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    point: sumByProfile[p.id] ?? 0,
  }));

  withPoints.sort((a, b) => b.point - a.point);

  let currentRank = 1;
  return withPoints.map((row, i) => {
    if (i > 0 && row.point < withPoints[i - 1].point) {
      currentRank = i + 1;
    }
    return {
      rank: currentRank,
      name: row.name ?? "(알 수 없음)",
      point: row.point,
      id: row.id,
    };
  });
}

/**
 * 완등 랭크포인트 상위 N명 (메인 위젯용, 전체 목록 조회 없이 빠르게)
 */
export async function getRankPointLeaders(limit = 500): Promise<RankPointLeader[]> {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return [];
  }
  const capped = Math.min(Math.max(1, limit), 500);
  const { data: logs } = await supabase
    .from("exercise_logs")
    .select("profile_id, route_id, logged_at, route:routes(rank_point)")
    .eq("is_completed", true)
    .order("logged_at", { ascending: true });

  if (!logs?.length) return [];

  const routeSeenByProfile: Record<string, Set<string>> = {};
  const sumByProfile: Record<string, number> = {};
  for (const row of logs) {
    const profileId = row.profile_id as string;
    const routeId = row.route_id as string;
    const route = Array.isArray(row.route) ? row.route[0] : row.route;
    const point = route?.rank_point;
    if (point == null || typeof point !== "number") continue;
    if (!routeSeenByProfile[profileId]) routeSeenByProfile[profileId] = new Set();
    if (routeSeenByProfile[profileId].has(routeId)) continue;
    routeSeenByProfile[profileId].add(routeId);
    sumByProfile[profileId] = (sumByProfile[profileId] ?? 0) + point;
  }

  const sorted = Object.entries(sumByProfile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, capped);

  if (sorted.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", sorted.map(([id]) => id));

  const idToName = new Map((profiles ?? []).map((p) => [p.id, p.name]));
  let currentRank = 1;
  return sorted.map(([id, point], i) => {
    if (i > 0 && point < sorted[i - 1][1]) currentRank = i + 1;
    return {
      rank: currentRank,
      name: idToName.get(id) ?? "(알 수 없음)",
      point,
    };
  });
}

/**
 * 전체 회원 랭킹 페이지네이션
 * searchQuery: 회원명 필터 (부분 일치, 대소문자 무시)
 */
export async function getRankPointLeadersPaginated(
  page: number,
  pageSize: number,
  searchQuery?: string
): Promise<{ leaders: RankPointLeader[]; total: number }> {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return { leaders: [], total: 0 };
  }
  let full = await getFullRankingList(supabase);
  const q = searchQuery?.trim().toLowerCase();
  if (q) {
    full = full.filter((l) => l.name.toLowerCase().includes(q));
  }
  const total = full.length;
  const start = (Math.max(1, page) - 1) * Math.max(1, pageSize);
  const leaders = full.slice(start, start + Math.max(1, pageSize));
  return { leaders, total };
}
