import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Media = { url: string; type: string; thumbnail_url: string };

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("feed_posts")
    .select("media")
    .order("created_at", { ascending: false })
    .limit(100);

  const thumbnails: string[] = [];
  for (const post of data ?? []) {
    const media = (post.media as Media[]) ?? [];
    for (const m of media) {
      if (m.type === "image" && m.thumbnail_url) {
        thumbnails.push(m.thumbnail_url);
      }
    }
  }

  const shuffled = thumbnails.sort(() => Math.random() - 0.5).slice(0, 20);
  return NextResponse.json(shuffled);
}
