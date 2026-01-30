import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function GalleryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("photo_album_posts")
    .select(
      `
      id,
      title,
      body,
      images,
      created_at,
      author:profiles(id, name)
    `
    )
    .eq("id", id)
    .single();

  if (error || !post) notFound();

  const row = post as unknown as {
    id: string;
    title: string;
    body: string;
    images: string[];
    created_at: string;
    author: { id: string; name: string } | { id: string; name: string }[] | null;
  };
  const author = Array.isArray(row.author) ? row.author[0] : row.author;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <article className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {row.title}
        </h1>
        <div className="mb-4 flex gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <span>작성자: {author?.name ?? "-"}</span>
          <span>작성일자: {new Date(row.created_at).toLocaleString("ko-KR")}</span>
        </div>
        {row.body && (
          <div className="mb-6 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {row.body}
          </div>
        )}
        {row.images?.length ? (
          <div className="flex flex-col gap-4">
            {row.images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${row.title} ${i + 1}`}
                className="max-h-96 w-full object-contain"
              />
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400">이미지 없음</p>
        )}
      </article>
      <p className="mt-6">
        <Link
          href="/gallery"
          className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          목록으로
        </Link>
      </p>
    </div>
  );
}
