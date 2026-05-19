import Link from "next/link";
import Image from "next/image";
import { FeedPost } from "./types";

function cldUrl(url: string, width: number): string {
  if (!url) return url;
  return url.replace("/upload/", `/upload/w_${width},c_fill,q_auto:low,f_auto/`);
}

export function FeedGrid({ posts }: { posts: FeedPost[] }) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post) => {
        const firstMedia = post.media[0];
        return (
          <Link key={post.id} href={`/feed/posts/${post.id}`} className="relative block aspect-square overflow-hidden bg-[var(--surface-muted)]">
            {firstMedia ? (
              <>
                <Image
                  src={cldUrl(firstMedia.thumbnail_url, 300)}
                  alt=""
                  fill
                  sizes="33vw"
                  className="object-cover transition hover:opacity-90"
                />
                {firstMedia.type === "video" && (
                  <div className="absolute top-1.5 right-1.5">
                    <svg className="h-4 w-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
                {post.media.length > 1 && (
                  <div className="absolute top-1.5 right-1.5">
                    <svg className="h-4 w-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--chalk-muted)]">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
