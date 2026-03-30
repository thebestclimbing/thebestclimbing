"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FeedPost, RawFeedPost, normalizePost } from "./types";
import { FeedPostCard } from "./FeedPostCard";
import { FeedGrid } from "./FeedGrid";

const PAGE_SIZE = 20;

export function FeedClient({
  initialPosts,
  currentUserId,
}: {
  initialPosts: FeedPost[];
  currentUserId: string | null;
}) {
  const [view, setView] = useState<"card" | "grid">("card");
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("feed_posts")
      .select(`
        id, caption, media, created_at, author_id,
        author:profiles(id, name),
        likes:feed_likes(count),
        comments:feed_comments(count)
      `)
      .order("created_at", { ascending: false })
      .range(posts.length, posts.length + PAGE_SIZE - 1);

    const newPosts = (data ?? []).map((p) => normalizePost(p as unknown as RawFeedPost));
    setPosts((prev) => [...prev, ...newPosts]);
    setHasMore(newPosts.length === PAGE_SIZE);
    setLoading(false);
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--chalk)]">피드</h1>
        <div className="flex items-center gap-2">
          {/* 카드/그리드 전환 */}
          <button
            type="button"
            onClick={() => setView("card")}
            className={`rounded-lg p-2 transition ${view === "card" ? "bg-[var(--primary)] text-white" : "text-[var(--chalk-muted)] hover:bg-[var(--surface-muted)]"}`}
            aria-label="카드 보기"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="7" rx="1"/><rect x="3" y="14" width="18" height="7" rx="1"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`rounded-lg p-2 transition ${view === "grid" ? "bg-[var(--primary)] text-white" : "text-[var(--chalk-muted)] hover:bg-[var(--surface-muted)]"}`}
            aria-label="그리드 보기"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>
          {/* 새 게시글 */}
          {currentUserId && (
            <Link
              href="/feed/new"
              className="btn-primary ml-1 inline-flex items-center gap-1 px-3 py-2 text-sm"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              올리기
            </Link>
          )}
        </div>
      </div>

      {/* 게시글 없음 */}
      {posts.length === 0 && (
        <p className="mt-8 text-center text-[var(--chalk-muted)]">아직 게시글이 없습니다.</p>
      )}

      {/* 카드 뷰 */}
      {view === "card" && (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* 그리드 뷰 */}
      {view === "grid" && <FeedGrid posts={posts} />}

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="btn-outline px-6 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "불러오는 중..." : "더 보기"}
          </button>
        </div>
      )}
    </div>
  );
}
