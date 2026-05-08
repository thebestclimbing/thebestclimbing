import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/notice/latest
 * 가장 최신 공지 3건 반환 (id, title, created_at)
 * 반환: { notices: { id: string; title: string; created_at: string }[] }
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

  const { data: rows } = await supabase
    .from("notices")
    .select("id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  return NextResponse.json({
    notices: (rows ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      created_at: r.created_at,
    })),
  });
}
