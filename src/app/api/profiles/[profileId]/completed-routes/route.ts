import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CompletedRouteItem = {
  name: string;
  rank_point: number | null;
  grade_value: string | null;
  grade_detail: string | null;
};

/**
 * GET /api/profiles/[profileId]/completed-routes
 * 해당 회원의 완등한 루트 목록 (루트당 1회, 이름·난이도·난이도점수)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  if (!profileId) {
    return NextResponse.json({ routes: [] });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "설정이 되어 있지 않습니다." },
      { status: 500 }
    );
  }

  const { data: logs } = await supabase
    .from("exercise_logs")
    .select("route_id, logged_at, route:routes(name, rank_point, grade_value, grade_detail)")
    .eq("profile_id", profileId)
    .eq("is_completed", true)
    .order("logged_at", { ascending: true });

  const seen = new Set<string>();
  const routes: CompletedRouteItem[] = [];

  for (const row of logs ?? []) {
    const routeId = row.route_id as string;
    if (seen.has(routeId)) continue;
    seen.add(routeId);
    const route = Array.isArray(row.route) ? row.route[0] : row.route;
    if (!route) continue;
    const r = route as { name?: string; rank_point?: number | null; grade_value?: string | null; grade_detail?: string | null };
    routes.push({
      name: r.name ?? "-",
      rank_point: r.rank_point ?? null,
      grade_value: r.grade_value ?? null,
      grade_detail: r.grade_detail ?? null,
    });
  }

  routes.sort((a, b) => (b.rank_point ?? -1) - (a.rank_point ?? -1));

  return NextResponse.json({ routes });
}
