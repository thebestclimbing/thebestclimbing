import Link from "next/link";
import { getTodayCompleters, getWeeklyCompleters } from "@/lib/completers";
import type { CompleterDisplay } from "@/lib/completers";

function CompleterCard({ c, rank }: { c: CompleterDisplay; rank: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="mr-2 font-semibold text-amber-600 dark:text-amber-400">
        {rank}위
      </span>
      <span className="text-zinc-600 dark:text-zinc-400">{c.wallTypeLabel}</span>
      <span className="mx-2 text-zinc-400">|</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-50">
        {c.routeName}
      </span>
      <span className="mx-2 text-zinc-500">난이도 {c.grade}</span>
      <span className="text-zinc-600 dark:text-zinc-400">· {c.memberName}</span>
    </div>
  );
}

export default async function Home() {
  const [todayCompleters, weeklyCompleters] = await Promise.all([
    getTodayCompleters(3),
    getWeeklyCompleters(3),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            베스트클라이밍
          </h1>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/board"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              자유게시판
            </Link>
            <Link
              href="/notice"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              공지사항
            </Link>
            <Link
              href="/attendance"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              출석체크
            </Link>
            <Link
              href="/gallery"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              사진첩
            </Link>
            <Link
              href="/statistics"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              통계
            </Link>
            <Link
              href="/login"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              로그인
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* 오늘의 완등자 */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            오늘의 완등자
          </h2>
          <div className="flex flex-col gap-2">
            {todayCompleters.length === 0 ? (
              <p className="rounded-lg border border-zinc-200 bg-white p-6 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                오늘 완등 기록이 없습니다.
              </p>
            ) : (
              todayCompleters.map((c, i) => (
                <CompleterCard key={i} c={c} rank={i + 1} />
              ))
            )}
          </div>
        </section>

        {/* 주간 완등자 */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            주간 완등자
          </h2>
          <div className="flex flex-col gap-2">
            {weeklyCompleters.length === 0 ? (
              <p className="rounded-lg border border-zinc-200 bg-white p-6 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                이번 주 완등 기록이 없습니다.
              </p>
            ) : (
              weeklyCompleters.map((c, i) => (
                <CompleterCard key={i} c={c} rank={i + 1} />
              ))
            )}
          </div>
        </section>

        {/* 사용자 / 관리자 링크 */}
        <section className="flex flex-wrap gap-4">
          <Link
            href="/member"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            회원정보
          </Link>
          <Link
            href="/exercise"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            나의 운동일지
          </Link>
          <Link
            href="/member/register"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            회원가입
          </Link>
          <Link
            href="/reservation"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            일일체험 예약
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-amber-500 px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
          >
            관리자
          </Link>
        </section>
      </main>
    </div>
  );
}
