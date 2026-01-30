import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MembersTableWithSearch } from "./MembersTableWithSearch";

export default async function AdminMembersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/members");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") redirect("/");

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, email, phone, phone_tail4, membership_start, membership_end, membership_paused, membership_paused_at, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">회원관리</h1>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">
        회원관리
      </h1>
      <p className="mb-4 text-sm text-[var(--chalk-muted)]">
        성명, 전화번호, 회원권 기간
      </p>
      <MembersTableWithSearch profiles={profiles ?? []} />
      <p className="mt-6">
        <Link
          href="/admin"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          관리자 홈
        </Link>
      </p>
    </div>
  );
}
