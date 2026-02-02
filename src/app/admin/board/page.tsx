import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateKST } from "@/lib/date";
import { BoardPostDeleteButton } from "./BoardPostDeleteButton";

type Row = {
  id: string;
  title: string;
  created_at: string;
  author: { id: string; name: string } | { id: string; name: string }[] | null;
};

function getAuthor(r: Row) {
  return Array.isArray(r.author) ? r.author[0] : r.author;
}

export default async function AdminBoardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/board");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") redirect("/");

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
    .limit(100);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold text-[var(--chalk)]">게시판관리</h1>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">게시판관리</h1>
      <p className="mb-4 text-sm text-[var(--chalk-muted)]">
        자유게시판 글 목록입니다. 보기·수정·삭제할 수 있습니다.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden -mx-4 sm:mx-0">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">제목</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk-muted)]">작성자</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk-muted)] whitespace-nowrap">작성일</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)] whitespace-nowrap">액션</th>
            </tr>
          </thead>
          <tbody>
            {(posts ?? []).map((p) => {
              const row = p as unknown as Row;
              const author = getAuthor(row);
              return (
                <tr key={row.id} className="border-b border-[var(--border)]">
                  <td className="p-1.5 sm:p-2">
                    <Link
                      href={"/board/" + row.id}
                      className="font-medium text-[var(--chalk)] hover:underline"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">
                    {author?.name ?? "-"}
                  </td>
                  <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)] whitespace-nowrap">
                    {formatDateKST(row.created_at)}
                  </td>
                  <td className="p-1.5 sm:p-2 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Link
                        href={"/board/" + row.id}
                        className="text-sm text-[var(--chalk-muted)] hover:underline"
                      >
                        보기
                      </Link>
                      <Link
                        href={"/admin/board/" + row.id + "/edit"}
                        className="text-sm text-[var(--primary)] hover:underline"
                      >
                        수정
                      </Link>
                      <BoardPostDeleteButton postId={row.id} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(!posts || posts.length === 0) && (
        <p className="mt-4 text-[var(--chalk-muted)]">등록된 글이 없습니다.</p>
      )}
      <p className="mt-6">
        <Link
          href="/admin/members"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          관리자 메뉴
        </Link>
      </p>
    </div>
  );
}
