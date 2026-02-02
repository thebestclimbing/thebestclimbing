import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BoardWriteForm from "@/app/board/BoardWriteForm";

export default async function AdminBoardEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/board/" + id + "/edit");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") redirect("/");

  const { data: post, error } = await supabase
    .from("free_board_posts")
    .select("id, title, body")
    .eq("id", id)
    .single();

  if (error || !post) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">게시글 수정</h1>
      <BoardWriteForm authorId={user.id} post={post} redirectTo="/admin/board" />
      <p className="mt-6">
        <Link
          href="/admin/board"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          목록으로
        </Link>
      </p>
    </div>
  );
}
