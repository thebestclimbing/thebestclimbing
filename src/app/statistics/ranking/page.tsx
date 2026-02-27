import Link from "next/link";
import { headers } from "next/headers";
import { RankingTableWithModal } from "./RankingTableWithModal";

const DEFAULT_PAGE_SIZE = 20;

async function fetchLeadersPage(
  page: number,
  pageSize: number,
  searchQuery?: string
): Promise<{ leaders: { rank: number; name: string; point: number; id?: string }[]; total: number }> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const base = `${protocol}://${host}`;
  const url = new URL(`${base}/api/rank-point-leaders`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(pageSize));
  if (searchQuery?.trim()) url.searchParams.set("q", searchQuery.trim());
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return { leaders: [], total: 0 };
  const data = await res.json();
  return {
    leaders: Array.isArray(data?.leaders) ? data.leaders : [],
    total: typeof data?.total === "number" ? data.total : 0,
  };
}

function buildQueryString(params: { page?: number; size?: number; q?: string }) {
  const sp = new URLSearchParams();
  if (params.page != null && params.page > 1) sp.set("page", String(params.page));
  if (params.size != null && params.size !== DEFAULT_PAGE_SIZE) sp.set("size", String(params.size));
  if (params.q?.trim()) sp.set("q", params.q.trim());
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(params.size ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE));
  const searchQuery = params.q ?? "";

  const { leaders, total } = await fetchLeadersPage(page, pageSize, searchQuery);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageNumbers: number[] = [];
  const showPages = 5;
  let start = Math.max(1, currentPage - Math.floor(showPages / 2));
  const end = Math.min(totalPages, start + showPages - 1);
  if (end - start + 1 < showPages) start = Math.max(1, end - showPages + 1);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  const query = (p?: number) => buildQueryString({ page: p ?? currentPage, size: pageSize, q: searchQuery });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--chalk)]">
        랭킹 순위
      </h1>
      <p className="mb-4 text-sm text-[var(--chalk-muted)]">
        완등한 루트의 랭크포인트 합계(루트당 1회) 순위 · 전체 {total}명
      </p>

      <form method="get" action="/statistics/ranking" className="mb-6 flex flex-wrap items-center gap-2">
        <input type="hidden" name="size" value={pageSize} />
        <label htmlFor="ranking-search" className="sr-only">회원명 검색</label>
        <input
          id="ranking-search"
          type="search"
          name="q"
          defaultValue={searchQuery}
          placeholder="회원명 검색"
          className="input-base w-full max-w-xs"
        />
        <button type="submit" className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          검색
        </button>
      </form>

      {leaders.length === 0 ? (
        <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-[var(--chalk-muted)]">
          완등 랭크포인트 기록이 없습니다.
        </p>
      ) : (
        <>
          <RankingTableWithModal leaders={leaders} />

          {totalPages > 1 && (
            <nav className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="페이지 이동">
              {currentPage > 1 ? (
                <Link
                  href={`/statistics/ranking${query(currentPage - 1)}`}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--chalk)] hover:bg-[var(--surface-muted)]"
                >
                  이전
                </Link>
              ) : (
                <span className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--chalk-muted)]">
                  이전
                </span>
              )}
              {pageNumbers.map((n) => (
                <Link
                  key={n}
                  href={`/statistics/ranking${query(n)}`}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    n === currentPage
                      ? "bg-[var(--primary)] text-white"
                      : "border border-[var(--border)] bg-[var(--surface)] text-[var(--chalk)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  {n}
                </Link>
              ))}
              {currentPage < totalPages ? (
                <Link
                  href={`/statistics/ranking${query(currentPage + 1)}`}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--chalk)] hover:bg-[var(--surface-muted)]"
                >
                  다음
                </Link>
              ) : (
                <span className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--chalk-muted)]">
                  다음
                </span>
              )}
            </nav>
          )}
        </>
      )}

      <p className="mt-6">
        <Link
          href="/statistics"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          통계 목록
        </Link>
      </p>
    </div>
  );
}
