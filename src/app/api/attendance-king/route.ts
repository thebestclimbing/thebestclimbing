import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMonthStartEndKST } from "@/lib/date";

/**
 * GET /api/attendance-king
 * 이달(한국 시간 기준) 출석 횟수가 가장 많은 회원의 성명·출석 횟수 반환
 * 반환: { name: string | null, count: number }
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
    return NextResponse.json({ name: null, count: 0 });
  }

  const countByProfile: Record<string, number> = {};
  for (const r of rows) {
    const id = r.profile_id as string;
    countByProfile[id] = (countByProfile[id] ?? 0) + 1;
  }

  let topProfileId: string | null = null;
  let maxCount = 0;
  for (const [id, count] of Object.entries(countByProfile)) {
    if (count > maxCount) {
      maxCount = count;
      topProfileId = id;
    }
  }

  if (!topProfileId) {
    return NextResponse.json({ name: null, count: 0 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", topProfileId)
    .single();

  return NextResponse.json({
    name: profile?.name ?? null,
    count: maxCount,
  });
}
