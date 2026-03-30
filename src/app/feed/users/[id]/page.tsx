import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FeedPost, RawFeedPost, normalizePost } from "../../types";
import { FeedGrid } from "../../FeedGrid";

export default async function FeedUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: profile, error: profileError },
    { data: rawPosts },
    { data: { user } },
  ] = await Promise.all([
    supabase.from("profiles").select("id, name").eq("id", id).single(),
    supabase
      .from("feed_posts")
      .select(`
        id, caption, media, created_at, author_id,
        author:profiles(id, name),
        likes:feed_likes(count),
        comments:feed_comments(count)
      `)
      .eq("author_id", id)
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  if (profileError || !profile) notFound();

  const posts: FeedPost[] = (rawPosts ?? []).map((p) =>
    normalizePost(p as unknown as RawFeedPost)
  );

  const isOwnProfile = user?.id === id;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* 프로필 헤더 */}
      <div className="mb-6 flex items-center gap-4">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-2xl font-bold text-white">
          {(profile.name ?? "?").slice(0, 2)}
        </span>
        <div>
          <h1 className="text-xl font-bold text-[var(--chalk)]">{profile.name}</h1>
          <p className="text-sm text-[var(--chalk-muted)]">게시글 {posts.length}개</p>
        </div>
        {isOwnProfile && (
          <Link href="/feed/new" className="btn-primary ml-auto px-4 py-2 text-sm">
            올리기
          </Link>
        )}
      </div>

      {/* 게시글 그리드 */}
      {posts.length > 0 ? (
        <FeedGrid posts={posts} />
      ) : (
        <p className="mt-8 text-center text-[var(--chalk-muted)]">아직 게시글이 없습니다.</p>
      )}

      <p className="mt-6">
        <Link href="/feed" className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]">
          피드로 돌아가기
        </Link>
      </p>
    </div>
  );
}
