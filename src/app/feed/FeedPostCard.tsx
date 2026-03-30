"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FeedPost } from "./types";
import { formatDateTimeKST } from "@/lib/date";
import { MediaCarousel } from "./MediaCarousel";

function getInitials(name: string) {
  return name.trim().slice(0, 2);
}

export function FeedPostCard({ post }: { post: FeedPost }) {
  const router = useRouter();

  return (
    <div className="card rounded-2xl overflow-hidden">
      {/* 헤더: 프로필 */}
      <div className="flex items-center gap-3 p-4">
        <Link href={`/feed/users/${post.author_id}`}>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
            {getInitials(post.author?.name ?? "?")}
          </span>
        </Link>
        <div>
          <Link
            href={`/feed/users/${post.author_id}`}
            className="text-sm font-semibold text-[var(--chalk)] hover:text-[var(--primary)]"
          >
            {post.author?.name ?? "-"}
          </Link>
          <p className="text-xs text-[var(--chalk-muted)]">
            {formatDateTimeKST(post.created_at)}
          </p>
        </div>
      </div>

      {/* 미디어 */}
      {post.media.length > 0 && (
        <MediaCarousel
          urls={post.media.map((m) => m.url)}
          size={600}
          onTap={() => router.push(`/feed/posts/${post.id}`)}
        />
      )}

      {/* 캡션 + 좋아요/댓글 수 */}
      <div className="p-4">
        {post.caption && (
          <p className="mb-2 text-sm text-[var(--chalk)] line-clamp-2">{post.caption}</p>
        )}
        <div className="flex gap-4 text-sm text-[var(--chalk-muted)]">
          <Link href={`/feed/posts/${post.id}`} className="flex items-center gap-1 hover:text-[var(--primary)]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {post.likes_count}
          </Link>
          <Link href={`/feed/posts/${post.id}`} className="flex items-center gap-1 hover:text-[var(--primary)]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post.comments_count}
          </Link>
        </div>
      </div>
    </div>
  );
}
