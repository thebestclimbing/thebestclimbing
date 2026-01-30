import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function BoardPage() {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("free_board_posts")
    .select(
      `
      id,
      title,
      created_at,
      author:profiles(id, name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">자유게시판</h1>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  type Row = {
    id: string;
    title: string;
    created_at: string;
    author: { id: string; name: string } | { id: string; name: string }[] | null;
  };
  const getAuthor = (r: Row) => (Array.isArray(r.author) ? r.author[0] : r.author);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          자유게시판
        </h1>
        <Link
          href="/board/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          글쓰기
        </Link>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                제목
              </th>
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                작성자
              </th>
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                작성일자
              </th>
            </tr>
          </thead>
          <tbody>
            {(posts ?? []).map((p) => {
              const row = p as unknown as Row;
              const author = getAuthor(row);
              return (
                <tr
                  key={row.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="p-3">
                    <Link
                      href={"/board/" + row.id}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {author?.name ?? "-"}
                  </td>
                  <td className="p-3 text-zinc-500 dark:text-zinc-400">
                    {new Date(row.created_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(!posts || posts.length === 0) && (
        <p className="mt-4 text-zinc-500">글이 없습니다.</p>
      )}
      <p className="mt-6">
        <Link
          href="/"
          className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          메인으로
        </Link>
      </p>
    </div>
  );
}
