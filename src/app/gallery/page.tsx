import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateKST } from "@/lib/date";

export default async function GalleryPage() {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("photo_album_posts")
    .select(
      `
      id,
      title,
      created_at,
      images,
      author:profiles(id, name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">사진첩</h1>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  type Row = {
    id: string;
    title: string;
    created_at: string;
    images: string[];
    author: { id: string; name: string } | { id: string; name: string }[] | null;
  };
  const getAuthor = (r: Row) => (Array.isArray(r.author) ? r.author[0] : r.author);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--chalk)]">
          사진첩
        </h1>
        <Link
          href="/gallery/new"
          className="btn-primary inline-block px-4 py-2 text-center text-sm"
        >
          등록
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(posts ?? []).map((p) => {
          const row = p as unknown as Row;
          const author = getAuthor(row);
          const thumb = row.images?.length ? row.images[0] : null;
          return (
            <Link
              key={row.id}
              href={"/gallery/" + row.id}
              className="card overflow-hidden rounded-2xl"
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-[var(--surface-muted)] text-[var(--chalk-muted)]">
                  이미지 없음
                </div>
              )}
              <div className="p-3">
                <h2 className="font-medium text-[var(--chalk)]">
                  {row.title}
                </h2>
                <p className="text-xs text-[var(--chalk-muted)]">
                  {author?.name ?? "-"} ·{" "}
                  {formatDateKST(row.created_at)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      {(!posts || posts.length === 0) && (
        <p className="mt-4 text-[var(--chalk-muted)]">등록된 글이 없습니다.</p>
      )}
      <p className="mt-6">
        <Link
          href="/"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          메인으로
        </Link>
      </p>
    </div>
  );
}
