export type FeedMedia = {
  url: string;
  type: "image" | "video";
  thumbnail_url: string; // 이미지: url과 동일, 동영상: jpg 썸네일 URL
  public_id: string;
};

export type FeedPost = {
  id: string;
  author_id: string;
  caption: string;
  media: FeedMedia[];
  created_at: string;
  author: { id: string; name: string } | null;
  likes_count: number;
  comments_count: number;
};

export type FeedComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: { id: string; name: string } | null;
};

// Supabase join 결과 raw 타입 (여러 페이지에서 공통 사용)
export type RawFeedPost = {
  id: string;
  caption: string;
  media: unknown;
  created_at: string;
  author_id: string;
  author: { id: string; name: string } | { id: string; name: string }[] | null;
  likes: { count: number }[];
  comments: { count: number }[];
};

export function normalizePost(raw: RawFeedPost): FeedPost {
  return {
    id: raw.id,
    caption: raw.caption,
    media: (raw.media as FeedMedia[]) ?? [],
    created_at: raw.created_at,
    author_id: raw.author_id,
    author: Array.isArray(raw.author) ? (raw.author[0] ?? null) : raw.author,
    likes_count: raw.likes?.[0]?.count ?? 0,
    comments_count: raw.comments?.[0]?.count ?? 0,
  };
}
