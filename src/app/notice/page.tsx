import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateKST } from "@/lib/date";

export default async function NoticePage() {
  const supabase = await createClient();
  const { data: notices, error } = await supabase
    .from("notices")
    .select(
      `
      id,
      title,
      popup_yn,
      created_at,
      author:profiles(id, name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">공지사항</h1>
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
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">
        공지사항
      </h1>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">
                제목
              </th>
              <th className="hidden p-1.5 sm:p-2 font-medium text-[var(--chalk)] sm:table-cell">
                작성자
              </th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)] whitespace-nowrap">
                작성일자
              </th>
            </tr>
          </thead>
          <tbody>
            {(notices ?? []).map((n) => {
              const row = n as unknown as Row;
              const author = getAuthor(row);
              return (
                <tr
                  key={row.id}
                  className="border-b border-[var(--border)]"
                >
                  <td className="p-1.5 sm:p-2">
                    <Link
                      href={"/notice/" + row.id}
                      className="font-medium text-[var(--chalk)] hover:underline"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className="hidden p-1.5 sm:p-2 text-[var(--chalk-muted)] sm:table-cell">
                    {author?.name ?? "-"}
                  </td>
                  <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)] whitespace-nowrap">
                    {formatDateKST(row.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(!notices || notices.length === 0) && (
        <p className="mt-4 text-[var(--chalk-muted)]">공지가 없습니다.</p>
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
