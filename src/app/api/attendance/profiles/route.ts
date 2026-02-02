import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/attendance/profiles?tail4=1234
 * 전화 뒷4자리로 회원 목록 조회 (로그인 불필요, 키오스크용)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tail4 = searchParams.get("tail4")?.trim() ?? "";

  if (tail4.length !== 4) {
    return NextResponse.json(
      { error: "전화뒷4자리는 4자리여야 합니다." },
      { status: 400 }
    );
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "출석 조회 설정이 되어 있지 않습니다. (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 500 }
    );
  }

  const { data: profiles, error } = await supabase.rpc("get_profiles_for_attendance", {
    p_tail4: tail4,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(profiles ?? []);
}
