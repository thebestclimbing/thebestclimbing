import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GalleryWriteForm from "../GalleryWriteForm";

export default async function GalleryNewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/gallery/new");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        사진첩 등록
      </h1>
      <GalleryWriteForm authorId={user.id} />
      <p className="mt-6">
        <a
          href="/gallery"
          className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          목록으로
        </a>
      </p>
    </div>
  );
}
