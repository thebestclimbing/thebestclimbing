import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    .select("id, name, email, phone, phone_tail4, membership_start, membership_end, role, created_at")
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
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        회원관리
      </h1>
      <p className="mb-4 text-sm text-zinc-500">
        성명, 이메일, 전화번호, 전화번호 뒷 4자리, 회원권 기간
      </p>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                성명
              </th>
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                이메일
              </th>
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                전화번호
              </th>
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                뒷4자리
              </th>
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                회원권 시작
              </th>
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                회원권 종료
              </th>
              <th className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                역할
              </th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p) => (
              <tr
                key={p.id}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="p-3 text-zinc-900 dark:text-zinc-50">{p.name}</td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">
                  {p.email ?? "-"}
                </td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">
                  {p.phone}
                </td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">
                  {p.phone_tail4}
                </td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">
                  {p.membership_start ?? "-"}
                </td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">
                  {p.membership_end ?? "-"}
                </td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">
                  {p.role}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(!profiles || profiles.length === 0) && (
        <p className="mt-4 text-zinc-500">등록된 회원이 없습니다.</p>
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
