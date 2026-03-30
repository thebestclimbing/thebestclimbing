import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/feed/likes  body: { postId: string }
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  let body: { postId?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (!body.postId) return NextResponse.json({ error: "postId가 필요합니다." }, { status: 400 });

  const { error } = await supabase.from("feed_likes").insert({
    post_id: body.postId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true }); // 이미 좋아요
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/feed/likes  body: { postId: string }
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  let body: { postId?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (!body.postId) return NextResponse.json({ error: "postId가 필요합니다." }, { status: 400 });

  const { error } = await supabase
    .from("feed_likes")
    .delete()
    .eq("post_id", body.postId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
