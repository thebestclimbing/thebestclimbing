import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NoticeWriteForm } from "../NoticeWriteForm";
import type { DispatchVehicleOption, DispatchMemberOption } from "../DispatchManager";

export default async function AdminNoticeNewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/notices/new");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") redirect("/");

  const { data: vehicleRows } = await supabase
    .from("member_vehicles")
    .select("id, model, seat_count, owner:profiles(name)");
  const vehicles: DispatchVehicleOption[] = (vehicleRows ?? []).map((v) => {
    const row = v as unknown as {
      id: string;
      model: string;
      seat_count: number;
      owner: { name: string } | { name: string }[] | null;
    };
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
    return { id: row.id, model: row.model, seatCount: row.seat_count, ownerName: owner?.name ?? "" };
  });

  const { data: memberRows } = await supabase.from("profiles").select("id, name").order("name");
  const members: DispatchMemberOption[] = (memberRows ?? []).map((m) => ({ id: m.id, name: m.name }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">공지 추가</h1>
      <NoticeWriteForm authorId={user.id} vehicles={vehicles} members={members} />
      <p className="mt-6">
        <Link
          href="/admin/notices"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          목록으로
        </Link>
      </p>
    </div>
  );
}
