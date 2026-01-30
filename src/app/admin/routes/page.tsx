import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WALL_TYPE_LABELS, formatGrade } from "@/types/database";
import type { GradeDetail, GradeValue } from "@/types/database";
import RouteDeleteButton from "./RouteDeleteButton";
import RouteForm from "./RouteForm";

export default async function AdminRoutesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/routes");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") redirect("/");

  const { data: routes, error } = await supabase
    .from("routes")
    .select("id, wall_type, grade_value, grade_detail, name, hold_count, created_at")
    .order("name");

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">암벽문제관리</h1>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        암벽문제관리
      </h1>
      <RouteForm />
      <div className="mt-8 overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                암벽구분
              </th>
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                난이도
              </th>
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                루트명
              </th>
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                홀드수
              </th>
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                작업
              </th>
            </tr>
          </thead>
          <tbody>
            {(routes ?? []).map((r) => {
              const wallLabel =
                WALL_TYPE_LABELS[r.wall_type as keyof typeof WALL_TYPE_LABELS] ??
                r.wall_type;
              const grade = formatGrade(
                r.grade_value as GradeValue,
                r.grade_detail as GradeDetail
              );
              return (
                <tr
                  key={r.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {wallLabel}
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {grade}
                  </td>
                  <td className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {r.name}
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {r.hold_count}
                  </td>
                  <td className="p-3">
                    <RouteDeleteButton routeId={r.id} routeName={r.name} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(!routes || routes.length === 0) && (
        <p className="mt-4 text-zinc-500">등록된 루트가 없습니다.</p>
      )}
      <p className="mt-6">
        <Link
          href="/admin"
          className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          관리자 홈
        </Link>
      </p>
    </div>
  );
}

