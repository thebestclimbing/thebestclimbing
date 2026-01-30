import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BoardWriteForm from "../BoardWriteForm";

export default async function BoardNewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/board/new");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        자유게시판 글쓰기
      </h1>
      <BoardWriteForm authorId={user.id} />
      <p className="mt-6">
        <a
          href="/board"
          className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          목록으로
        </a>
      </p>
    </div>
  );
}
