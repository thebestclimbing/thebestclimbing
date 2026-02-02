import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPhone } from "@/lib/format";
import { LogoutButton } from "@/components/LogoutButton";

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
        <p className="text-[var(--chalk-muted)]">프로필을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">
        회원정보 조회
      </h1>
      <div className="card rounded-2xl p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-[var(--chalk-muted)] ">성명</dt>
            <dd className="font-medium text-[var(--chalk)]">
              {profile.name}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--chalk-muted)] ">이메일</dt>
            <dd className="font-medium text-[var(--chalk)]">
              {profile.email ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--chalk-muted)] ">전화번호</dt>
            <dd className="font-medium text-[var(--chalk)]">
              {formatPhone(profile.phone)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--chalk-muted)] ">회원권 기간</dt>
            <dd className="font-medium text-[var(--chalk)]">
              {profile.membership_start && profile.membership_end
                ? `${profile.membership_start} ~ ${profile.membership_end}`
                : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--chalk-muted)]">회원권 만료일자</dt>
            <dd className="font-medium text-[var(--chalk)]">
              {profile.membership_end ?? "-"}
            </dd>
          </div>
        </dl>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Link
          href="/"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          메인으로
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
