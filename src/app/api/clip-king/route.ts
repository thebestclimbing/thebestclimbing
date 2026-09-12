import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMonthStartEndKST } from "@/lib/date";
import { effectiveProgressCount } from "@/lib/exercise-holds";

/**
 * GET /api/clip-king
 * 이달(한국 시간 기준) 외벽문제 진행한 클립 수(왕복 포함 progress_clip_count 합계) 상위 3명 반환
 * 반환: { leaders: { rank: number; name: string; count: number }[] }
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

  const { start: monthStart, end: monthEnd } = getMonthStartEndKST();

  const { data: rows } = await supabase
    .from("outdoor_exercise_logs")
    .select("profile_id, progress_clip_count, round_trip_count")
    .gte("logged_at", monthStart)
    .lte("logged_at", monthEnd);

  if (!rows?.length) {
    return NextResponse.json({ leaders: [] });
  }

  const sumByProfile: Record<string, number> = {};
  for (const r of rows) {
    const id = r.profile_id as string;
    const count = effectiveProgressCount(
      (r.progress_clip_count as number) || 0,
      (r.round_trip_count as number) || 0
    );
    sumByProfile[id] = (sumByProfile[id] ?? 0) + count;
  }

  const sorted = Object.entries(sumByProfile).sort((a, b) => b[1] - a[1]);
  const top3 = sorted.slice(0, 3);

  const profileIds = top3.map(([id]) => id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", profileIds);

  const nameById: Record<string, string> = {};
  for (const p of profiles ?? []) {
    nameById[p.id] = p.name ?? "";
  }

  const leaders = top3.map(([id, count]) => ({
    rank: sorted.findIndex(([, c]) => c === count) + 1,
    name: nameById[id] ?? "",
    count,
  }));

  return NextResponse.json({ leaders });
}
