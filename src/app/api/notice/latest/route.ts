import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/notice/latest
 * 가장 최신 공지 1건 반환 (id, title, created_at)
 * 반환: { id: string; title: string; created_at: string } | null
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

  const { data: row } = await supabase
    .from("notices")
    .select("id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!row) {
    return NextResponse.json({ notice: null });
  }

  return NextResponse.json({
    notice: {
      id: row.id,
      title: row.title,
      created_at: row.created_at,
    },
  });
}
