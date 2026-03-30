import Link from "next/link";
import { FeedPost } from "./types";
import { formatDateTimeKST } from "@/lib/date";

function getInitials(name: string) {
  return name.trim().slice(0, 2);
}

function cldUrl(url: string, width: number): string {
  if (!url) return url;
  return url.replace("/upload/", `/upload/w_${width},c_fill,q_auto,f_auto/`);
}

export function FeedPostCard({ post }: { post: FeedPost }) {
  const firstMedia = post.media[0];

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
      {firstMedia && (
        <Link href={`/feed/posts/${post.id}`}>
          {firstMedia.type === "video" ? (
            <div className="relative">
              <img
                src={cldUrl(firstMedia.thumbnail_url, 800)}
                alt="동영상 썸네일"
                className="w-full aspect-square object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-black/50 p-3">
                  <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {post.media.length > 1 && (
                <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                  +{post.media.length - 1}
                </span>
              )}
            </div>
          ) : (
            <div className="relative">
              <img
                src={cldUrl(firstMedia.url, 800)}
                alt=""
                className="w-full aspect-square object-cover"
              />
              {post.media.length > 1 && (
                <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                  +{post.media.length - 1}
                </span>
              )}
            </div>
          )}
        </Link>
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
