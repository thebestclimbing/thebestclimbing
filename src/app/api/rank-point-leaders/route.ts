import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type RankPointLeader = { rank: number; name: string; point: number };

/**
 * GET /api/rank-point-leaders
 * 완등한 루트의 랭크포인트 합계(루트당 1회만) 상위 3명 반환
 * 반환: { leaders: RankPointLeader[] }
 */
export async function GET() {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "설정이 되어 있지 않습니다. (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 500 }
    );
  }

  const { data: logs } = await supabase
    .from("exercise_logs")
    .select("profile_id, route_id, logged_at, route:routes(rank_point)")
    .eq("is_completed", true)
    .order("logged_at", { ascending: true });

  if (!logs?.length) {
    return NextResponse.json({ leaders: [] });
  }

  // 프로필별로 루트당 최초 1회만 랭크포인트 합산
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
    .slice(0, 3);

  if (sorted.length === 0) {
    return NextResponse.json({ leaders: [] });
  }

  const profileIds = sorted.map(([id]) => id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", profileIds);

  const idToName = new Map((profiles ?? []).map((p) => [p.id, p.name]));

  const leaders: RankPointLeader[] = sorted.map(([id, point], i) => ({
    rank: i + 1,
    name: idToName.get(id) ?? "(알 수 없음)",
    point,
  }));

  return NextResponse.json({ leaders });
}
