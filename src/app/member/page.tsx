import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MemberPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/member");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("name, email, phone, membership_start, membership_end")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">회원정보 조회</h1>
        <p className="text-zinc-500">프로필을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        회원정보 조회
      </h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">성명</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {profile.name}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">이메일</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {profile.email ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">전화번호</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {profile.phone}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">회원권 기간</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {profile.membership_start && profile.membership_end
                ? `${profile.membership_start} ~ ${profile.membership_end}`
                : "-"}
            </dd>
          </div>
        </dl>
      </div>
      <p className="mt-4">
        <Link
          href="/"
          className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          메인으로
        </Link>
      </p>
    </div>
  );
}
