import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

async function deleteCloudinaryImage(publicId: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
    .digest("hex");

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("timestamp", String(timestamp));
  form.append("api_key", API_KEY);
  form.append("signature", signature);

  await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
    method: "POST",
    body: form,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("feed_posts")
    .select("author_id, media")
    .eq("id", id)
    .single();

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (post.author_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Cloudinary 이미지 물리 삭제
  const media = (post.media as { public_id?: string }[]) ?? [];
  await Promise.allSettled(
    media.filter((m) => m.public_id).map((m) => deleteCloudinaryImage(m.public_id!))
  );

  // DB 삭제 (CASCADE로 likes/comments도 삭제됨)
  await admin.from("feed_posts").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
