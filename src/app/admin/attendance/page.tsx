import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AttendanceTableWithSearch } from "./AttendanceTableWithSearch";

export default async function AdminAttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/attendance");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") redirect("/");

  const { data: attendances, error } = await supabase
    .from("attendances")
    .select(
      `
      id,
      attended_at,
      checked_at,
      profile:profiles(id, name, phone_tail4)
    `
    )
    .order("checked_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">출석관리</h1>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">
        출석관리
      </h1>
      <p className="mb-4 text-sm text-[var(--chalk-muted)]">
        회원명, 출석일자, 체크 시각 (한국 시간)
      </p>
      <AttendanceTableWithSearch attendances={attendances ?? []} />
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
