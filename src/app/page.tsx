import Link from "next/link";
import { getTodayCompleters, getWeeklyCompleters } from "@/lib/completers";
import type { CompleterDisplay } from "@/lib/completers";
import { HomeMotion } from "@/components/HomeMotion";

function CompleterCard({ c, rank }: { c: CompleterDisplay; rank: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <span className="mr-2 font-semibold text-[var(--rope-light)]">{rank}위</span>
      <span className="text-[var(--chalk-muted)]">{c.wallTypeLabel}</span>
      <span className="mx-2 text-[var(--border)]">|</span>
      <span className="font-medium text-[var(--chalk)]">{c.routeName}</span>
      <span className="mx-2 text-[var(--chalk-muted)]">난이도 {c.grade}</span>
      <span className="text-[var(--chalk-muted)]">· {c.memberName}</span>
    </div>
  );
}

export default async function Home() {
  const [todayCompleters, weeklyCompleters] = await Promise.all([
    getTodayCompleters(3),
    getWeeklyCompleters(3),
  ]);

  return (
    <HomeMotion>
      {/* 히어로 */}
      <section className="mb-10">
        <h1 className="mb-1 text-xl font-bold text-[var(--chalk)] md:text-2xl">
          오늘도 한 걸음 더
        </h1>
        <p className="text-sm text-[var(--chalk-muted)]">
          완등 기록을 확인하고 동기부여를 받아보세요.
        </p>
      </section>

      {/* 오늘의 완등자 */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-[var(--chalk)]">
          오늘의 완등자
        </h2>
        <div className="flex flex-col gap-3">
          {todayCompleters.length === 0 ? (
            <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-center text-[var(--chalk-muted)]">
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
        <h2 className="mb-4 text-lg font-semibold text-[var(--chalk)]">
          주간 완등자
        </h2>
        <div className="flex flex-col gap-3">
          {weeklyCompleters.length === 0 ? (
            <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-center text-[var(--chalk-muted)]">
              이번 주 완등 기록이 없습니다.
            </p>
          ) : (
            weeklyCompleters.map((c, i) => (
              <CompleterCard key={i} c={c} rank={i + 1} />
            ))
          )}
        </div>
      </section>

      {/* 액션 링크 */}
      <section className="flex flex-wrap gap-3">
        <Link
          href="/member"
          className="rounded-xl bg-[var(--rope)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[var(--rope-light)] active:scale-[0.98]"
        >
          회원정보
        </Link>
        <Link
          href="/exercise"
          className="rounded-xl bg-[var(--rope)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[var(--rope-light)] active:scale-[0.98]"
        >
          나의 운동일지
        </Link>
        <Link
          href="/member/register"
          className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--chalk)] transition hover:bg-[var(--surface-elevated)] active:scale-[0.98]"
        >
          회원가입
        </Link>
        <Link
          href="/reservation"
          className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--chalk)] transition hover:bg-[var(--surface-elevated)] active:scale-[0.98]"
        >
          일일체험 예약
        </Link>
        <Link
          href="/admin"
          className="rounded-xl border border-[var(--rope)] px-4 py-3 text-sm font-medium text-[var(--rope-light)] transition hover:bg-[var(--rope)]/10 active:scale-[0.98]"
        >
          관리자
        </Link>
      </section>
    </HomeMotion>
  );
}
