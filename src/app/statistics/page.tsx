import Link from "next/link";

const STATISTICS_LINKS = [
  { href: "/statistics/member-routes", label: "회원별 운동일지에 등록한 루트 통계" },
  { href: "/statistics/member-completions", label: "회원별 루트 완등 통계" },
  { href: "/statistics/route-holds", label: "루트별 평균 진행한 홀드수 통계" },
  { href: "/statistics/route-completions", label: "루트별 완등 통계" },
  { href: "/statistics/month-logs", label: "기간별 운동일지에 등록한 루트 통계 (월별)" },
  { href: "/statistics/month-completions", label: "기간별 완등 통계 (월별)" },
] as const;

export default function StatisticsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--chalk)]">
        통계
      </h1>
      <p className="mb-6 text-sm text-[var(--chalk-muted)]">
        운동일지 항목을 기준으로 한 통계 목록
      </p>

      <ul className="flex flex-col gap-2">
        {STATISTICS_LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--chalk)] transition hover:bg-[var(--surface-muted)]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-6">
        <Link
          href="/"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          메인으로
        </Link>
      </p>
    </div>
  );
}
