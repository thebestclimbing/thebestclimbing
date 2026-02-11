import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMonthStartEndKST } from "@/lib/date";

/**
 * GET /api/hold-king
 * 이달(한국 시간 기준) 진행한 홀드 수(progress_hold_count 합계)가 가장 많은 회원의 성명·홀드 총 개수 반환
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
    .from("exercise_logs")
    .select("profile_id, progress_hold_count")
    .gte("logged_at", monthStart)
    .lte("logged_at", monthEnd);

  if (!rows?.length) {
    return NextResponse.json({ name: null, count: 0 });
  }

  const sumByProfile: Record<string, number> = {};
  for (const r of rows) {
    const id = r.profile_id as string;
    const count = (r.progress_hold_count as number) || 0;
    sumByProfile[id] = (sumByProfile[id] ?? 0) + count;
  }

  let topProfileId: string | null = null;
  let maxSum = 0;
  for (const [id, sum] of Object.entries(sumByProfile)) {
    if (sum > maxSum) {
      maxSum = sum;
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
    count: maxSum,
  });
}
