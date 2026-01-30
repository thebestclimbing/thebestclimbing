import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateKST } from "@/lib/date";

export default async function AdminNoticesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/notices");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") redirect("/");

  const { data: notices, error } = await supabase
    .from("notices")
    .select("id, title, popup_yn, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold text-[var(--chalk)]">공지관리</h1>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">공지관리</h1>
      <p className="mb-4 text-sm text-[var(--chalk-muted)]">
        공지를 추가하고, 팝업여부를 설정할 수 있습니다. 팝업여부 Y인 공지는 최초 사이트 진입 시 팝업으로 표시됩니다.
      </p>
      <div className="mb-4">
        <Link
          href="/admin/notices/new"
          className="inline-block rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)]"
        >
          공지 추가
        </Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden -mx-4 sm:mx-0">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">제목</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)]">팝업</th>
              <th className="p-1.5 sm:p-2 font-medium text-[var(--chalk)] whitespace-nowrap">작성일</th>
            </tr>
          </thead>
          <tbody>
            {(notices ?? []).map((n) => (
              <tr key={n.id} className="border-b border-[var(--border)]">
                <td className="p-1.5 sm:p-2">
                  <Link
                    href={"/notice/" + n.id}
                    className="font-medium text-[var(--chalk)] hover:underline"
                  >
                    {n.title}
                  </Link>
                </td>
                <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)]">
                  {(n as { popup_yn?: string }).popup_yn === "Y" ? "Y" : "N"}
                </td>
                <td className="p-1.5 sm:p-2 text-[var(--chalk-muted)] whitespace-nowrap">
                  {formatDateKST(n.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(!notices || notices.length === 0) && (
        <p className="mt-4 text-[var(--chalk-muted)]">등록된 공지가 없습니다.</p>
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
