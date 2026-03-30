import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FeedUploadForm from "./FeedUploadForm";

export default async function FeedNewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">새 게시글</h1>
      <FeedUploadForm authorId={user.id} />
    </div>
  );
}
