import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/notice/latest
 * 센터공지 최신 2건 + 등반공지 최신 2건 반환
 * 반환: { center: [...], climbing: [...] }
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

  const [centerRes, climbingRes] = await Promise.all([
    supabase
      .from("notices")
      .select("id, title, created_at")
      .eq("notice_type", "센터공지")
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("notices")
      .select("id, title, created_at")
      .eq("notice_type", "등반공지")
      .order("created_at", { ascending: false })
      .limit(2),
  ]);

  return NextResponse.json({
    center: (centerRes.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      created_at: r.created_at,
    })),
    climbing: (climbingRes.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      created_at: r.created_at,
    })),
  });
}
