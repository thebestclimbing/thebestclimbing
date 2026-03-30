"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LikeButton({
  postId,
  initialCount,
  currentUserId,
}: {
  postId: string;
  initialCount: number;
  currentUserId: string | null;
}) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();
    supabase
      .from("feed_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", currentUserId)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [postId, currentUserId]);

  async function toggle() {
    if (!currentUserId || loading) return;
    setLoading(true);

    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((c) => c + (wasLiked ? -1 : 1));

    const res = await fetch("/api/feed/likes", {
      method: wasLiked ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });

    if (!res.ok) {
      setLiked(wasLiked);
      setCount((c) => c + (wasLiked ? 1 : -1));
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!currentUserId || loading}
      className={`flex items-center gap-1.5 text-sm transition ${liked ? "text-red-500" : "text-[var(--chalk-muted)] hover:text-red-400"} disabled:cursor-not-allowed`}
    >
      <svg
        className="h-5 w-5"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <span>{count}</span>
    </button>
  );
}
