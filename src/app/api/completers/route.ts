import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCompletersInRange } from "@/lib/completers";
import { getTodayISOKST, getWeekStartEndKST, getMonthStartEndKST } from "@/lib/date";

/**
 * GET /api/completers?limit=3
 * 오늘/주간/월간 완등자 조회 (로그인 불필요)
 * 반환: { today: [], weekly: [], monthly: [] }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(10, Math.max(1, parseInt(searchParams.get("limit") ?? "3", 10) || 3));

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "완등자 조회 설정이 되어 있지 않습니다. (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 500 }
    );
  }

  const today = getTodayISOKST();
  const { start: weekStart, end: weekEnd } = getWeekStartEndKST();
  const { start: monthStart, end: monthEnd } = getMonthStartEndKST();

  const [todayList, weeklyList, monthlyList] = await Promise.all([
    getCompletersInRange(supabase, today, today, limit),
    getCompletersInRange(supabase, weekStart, weekEnd, limit),
    getCompletersInRange(supabase, monthStart, monthEnd, limit),
  ]);

  return NextResponse.json({
    today: todayList,
    weekly: weeklyList,
    monthly: monthlyList,
  });
}
