import { createClient } from "@/lib/supabase/server";
import { FeedClient } from "./FeedClient";
import { FeedPost, RawFeedPost, normalizePost } from "./types";

export default async function FeedPage() {
  const supabase = await createClient();

  const [{ data: rawPosts }, { data: { user } }] = await Promise.all([
    supabase
      .from("feed_posts")
      .select(`
        id, caption, media, created_at, author_id,
        author:profiles(id, name),
        likes:feed_likes(count),
        comments:feed_comments(count)
      `)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.auth.getUser(),
  ]);

  const posts: FeedPost[] = (rawPosts ?? []).map((p) =>
    normalizePost(p as unknown as RawFeedPost)
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <FeedClient initialPosts={posts} currentUserId={user?.id ?? null} />
    </div>
  );
}
