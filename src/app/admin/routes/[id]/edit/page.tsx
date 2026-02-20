import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RouteEditForm from "../../RouteEditForm";

export default async function AdminRouteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/routes/" + id + "/edit");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") redirect("/");

  const { data: route, error } = await supabase
    .from("routes")
    .select("id, wall_type, grade_value, grade_detail, name, hold_count, rank_point")
    .eq("id", id)
    .single();

  if (error || !route) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">암벽문제 수정</h1>
      <RouteEditForm route={route} />
      <p className="mt-6">
        <Link
          href="/admin/routes"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          목록으로
        </Link>
      </p>
    </div>
  );
}
