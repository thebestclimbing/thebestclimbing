import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** 오늘 날짜 YYYY-MM-DD (Asia/Seoul) */
function getTodayKST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/**
 * POST /api/attendance
 * body: { tail4: string, profileId: string }
 * 출석 등록 (로그인 불필요, 키오스크용)
 */
export async function POST(request: Request) {
  let body: { tail4?: string; profileId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const tail4 = String(body.tail4 ?? "").trim();
  const profileId = body.profileId;

  if (tail4.length !== 4) {
    return NextResponse.json(
      { error: "전화뒷4자리는 4자리여야 합니다." },
      { status: 400 }
    );
  }
  if (!profileId || typeof profileId !== "string") {
    return NextResponse.json(
      { error: "회원을 선택해 주세요." },
      { status: 400 }
    );
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "출석 등록 설정이 되어 있지 않습니다. (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 500 }
    );
  }

  const { data: profiles } = await supabase.rpc("get_profiles_for_attendance", {
    p_tail4: tail4,
  });

  if (!profiles?.length) {
    return NextResponse.json(
      { error: "등록된 회원이 없습니다." },
      { status: 404 }
    );
  }

  const found = (profiles as { id: string; name: string; membership_end: string | null }[]).find(
    (p) => p.id === profileId
  );
  if (!found) {
    return NextResponse.json(
      { error: "해당 전화뒷4자리와 일치하는 회원이 아닙니다." },
      { status: 400 }
    );
  }

  const todayKST = getTodayKST();
  const { error: insertError } = await supabase.from("attendances").insert({
    profile_id: profileId,
    attended_at: todayKST,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ already: true });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    profileName: found.name,
    membershipEnd: found.membership_end ?? null,
  });
}
