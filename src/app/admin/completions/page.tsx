import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WALL_TYPE_LABELS, formatGrade } from "@/types/database";
import type { GradeDetail, GradeValue } from "@/types/database";
import { CompletionConfirmButton } from "./CompletionConfirmButton";

export default async function AdminCompletionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/completions");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") redirect("/");

  const { data: logsRaw } = await supabase
    .from("exercise_logs")
    .select(
      `
      id,
      logged_at,
      completion_requested,
      is_completed,
      profile_id,
      route_id,
      profile:profiles(id, name),
      route:routes(id, name, wall_type, grade_value, grade_detail, hold_count)
    `
    )
    .eq("completion_requested", true)
    .eq("is_completed", false)
    .order("logged_at", { ascending: false });

  type Row = {
    id: string;
    logged_at: string;
    completion_requested: boolean;
    is_completed: boolean;
    profile_id: string;
    route_id: string;
    profile: { id: string; name: string } | { id: string; name: string }[] | null;
    route:
      | { id: string; name: string; wall_type: string; grade_value: GradeValue; grade_detail: GradeDetail; hold_count: number }
      | { id: string; name: string; wall_type: string; grade_value: GradeValue; grade_detail: GradeDetail; hold_count: number }[];
  };
  const rows = ((logsRaw ?? []) as Row[]).map((r) => ({
    ...r,
    profile: Array.isArray(r.profile) ? r.profile[0] ?? null : r.profile,
    route: Array.isArray(r.route) ? r.route[0] : r.route,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">
        회원 완등관리
      </h1>
      <p className="mb-4 text-sm text-[var(--chalk-muted)]">
        회원이 완등요청한 기록을 조회하고 완등완료 처리합니다.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden -mx-4 sm:mx-0">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)] whitespace-nowrap">날짜</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">회원</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">루트</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">난이도</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">동작</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const grade = formatGrade(r.route.grade_value, r.route.grade_detail);
              const wallLabel =
                WALL_TYPE_LABELS[r.route.wall_type as keyof typeof WALL_TYPE_LABELS] ??
                r.route.wall_type;
              return (
                <tr key={r.id} className="border-b border-[var(--border)]">
                  <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)] whitespace-nowrap">{r.logged_at}</td>
                  <td className="p-1.5 sm:p-2 text-[var(--chalk)]">
                    {(r as { profile: { name: string } | null }).profile?.name ?? "-"}
                  </td>
                  <td className="p-1.5 sm:p-2 text-[var(--chalk)]">
                    {r.route.name} ({wallLabel})
                  </td>
                  <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">{grade}</td>
                  <td className="p-1.5 sm:p-2">
                    <CompletionConfirmButton logId={r.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="mt-4 text-[var(--chalk-muted)]">완등요청된 기록이 없습니다.</p>
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
