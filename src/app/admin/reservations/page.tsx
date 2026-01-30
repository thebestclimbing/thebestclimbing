import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeKST } from "@/lib/date";
import ReservationConfirmButton from "./ReservationConfirmButton";

export default async function AdminReservationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/reservations");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") redirect("/");

  const { data: pending, error } = await supabase
    .from("daily_reservations")
    .select("id, guest_name, depositor_name, reserved_at, guest_count, status, created_at")
    .eq("status", "pending")
    .order("reserved_at", { ascending: true });

  const { data: confirmed } = await supabase
    .from("daily_reservations")
    .select("id, guest_name, depositor_name, reserved_at, guest_count, status, created_at")
    .eq("status", "confirmed")
    .order("reserved_at", { ascending: false })
    .limit(20);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">일일체험예약자관리</h1>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">
        일일체험예약자관리
      </h1>
      <p className="mb-4 text-sm text-[var(--chalk-muted)]">
        예약중 목록을 조회 후 예약완료로 변경하세요.
      </p>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-amber-600 dark:text-amber-400">
          예약중 ({pending?.length ?? 0})
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="p-3 font-medium text-[var(--chalk)]">
                  성명
                </th>
                <th className="p-3 font-medium text-[var(--chalk)]">
                  입금자명
                </th>
                <th className="p-3 font-medium text-[var(--chalk)]">
                  예약일시
                </th>
                <th className="p-3 font-medium text-[var(--chalk)]">
                  인원
                </th>
                <th className="p-3 font-medium text-[var(--chalk)]">
                  작업
                </th>
              </tr>
            </thead>
            <tbody>
              {(pending ?? []).map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--border)]"
                >
                  <td className="p-3 text-[var(--chalk)]">
                    {r.guest_name}
                  </td>
                  <td className="p-3 text-[var(--chalk-muted)]">
                    {r.depositor_name}
                  </td>
                  <td className="p-3 text-[var(--chalk-muted)]">
                    {formatDateTimeKST(r.reserved_at)}
                  </td>
                  <td className="p-3 text-[var(--chalk-muted)]">
                    {r.guest_count}명
                  </td>
                  <td className="p-3">
                    <ReservationConfirmButton reservationId={r.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!pending || pending.length === 0) && (
          <p className="mt-4 text-[var(--chalk-muted)]">예약중인 건이 없습니다.</p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-[var(--chalk)]">
          예약완료 (최근 20건)
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="p-3 font-medium text-[var(--chalk)]">
                  성명
                </th>
                <th className="p-3 font-medium text-[var(--chalk)]">
                  입금자명
                </th>
                <th className="p-3 font-medium text-[var(--chalk)]">
                  예약일시
                </th>
                <th className="p-3 font-medium text-[var(--chalk)]">
                  인원
                </th>
              </tr>
            </thead>
            <tbody>
              {(confirmed ?? []).map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--border)]"
                >
                  <td className="p-3 text-[var(--chalk)]">
                    {r.guest_name}
                  </td>
                  <td className="p-3 text-[var(--chalk-muted)]">
                    {r.depositor_name}
                  </td>
                  <td className="p-3 text-[var(--chalk-muted)]">
                    {formatDateTimeKST(r.reserved_at)}
                  </td>
                  <td className="p-3 text-[var(--chalk-muted)]">
                    {r.guest_count}명
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!confirmed || confirmed.length === 0) && (
          <p className="mt-4 text-[var(--chalk-muted)]">예약완료 건이 없습니다.</p>
        )}
      </section>

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
