import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FeedMedia, FeedComment } from "../../types";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";
import { MediaSlider } from "./MediaSlider";
import { formatDateTimeKST } from "@/lib/date";

export default async function FeedPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: post, error },
    { data: comments },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from("feed_posts")
      .select(`
        id, caption, media, created_at, author_id,
        author:profiles(id, name),
        likes:feed_likes(count)
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("feed_comments")
      .select("id, post_id, author_id, body, created_at, author:profiles(id, name)")
      .eq("post_id", id)
      .order("created_at", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  if (error || !post) notFound();

  const raw = post as unknown as {
    id: string; caption: string; media: unknown;
    created_at: string; author_id: string;
    author: { id: string; name: string } | { id: string; name: string }[] | null;
    likes: { count: number }[];
  };
  const author = Array.isArray(raw.author) ? raw.author[0] : raw.author;
  const media = (raw.media as FeedMedia[]) ?? [];
  const likesCount = raw.likes?.[0]?.count ?? 0;

  const normalizedComments: FeedComment[] = (comments ?? []).map((c) => ({
    id: c.id,
    post_id: c.post_id,
    author_id: c.author_id,
    body: c.body,
    created_at: c.created_at,
    author: Array.isArray(c.author) ? (c.author[0] ?? null) : (c.author as { id: string; name: string } | null),
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* 헤더 */}
      <div className="mb-4 flex items-center gap-3">
        <Link href={`/feed/users/${raw.author_id}`}>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] font-semibold text-white">
            {(author?.name ?? "?").slice(0, 2)}
          </span>
        </Link>
        <div>
          <Link
            href={`/feed/users/${raw.author_id}`}
            className="font-semibold text-[var(--chalk)] hover:text-[var(--primary)]"
          >
            {author?.name ?? "-"}
          </Link>
          <p className="text-xs text-[var(--chalk-muted)]">{formatDateTimeKST(raw.created_at)}</p>
        </div>
        <Link href="/feed" className="ml-auto text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]">
          목록
        </Link>
      </div>

      {/* 미디어 슬라이드 */}
      {media.length > 0 && <MediaSlider media={media} />}


      {/* 캡션 */}
      {raw.caption && (
        <p className="mt-4 text-[var(--chalk)]">{raw.caption}</p>
      )}

      {/* 좋아요 */}
      <div className="mt-4">
        <LikeButton postId={raw.id} initialCount={likesCount} currentUserId={user?.id ?? null} />
      </div>

      {/* 댓글 */}
      <div className="mt-2 border-t border-[var(--border)] pt-4">
        <CommentSection
          postId={raw.id}
          initialComments={normalizedComments}
          currentUserId={user?.id ?? null}
        />
      </div>
    </div>
  );
}

