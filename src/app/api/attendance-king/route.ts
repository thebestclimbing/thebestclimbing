import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMonthStartEndKST } from "@/lib/date";

/**
 * GET /api/attendance-king
 * 이달(한국 시간 기준) 출석 횟수 상위 3명 반환
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
    .from("attendances")
    .select("profile_id")
    .gte("attended_at", monthStart)
    .lte("attended_at", monthEnd);

  if (!rows?.length) {
    return NextResponse.json({ leaders: [] });
  }

  const countByProfile: Record<string, number> = {};
  for (const r of rows) {
    const id = r.profile_id as string;
    countByProfile[id] = (countByProfile[id] ?? 0) + 1;
  }

  const sorted = Object.entries(countByProfile).sort((a, b) => b[1] - a[1]);
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
