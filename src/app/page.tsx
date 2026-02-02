import { getTodayCompleters, getWeeklyCompleters } from "@/lib/completers";
import type { CompleterDisplay } from "@/lib/completers";
import { HomeMotion } from "@/components/HomeMotion";

function CompleterCard({ c, rank }: { c: CompleterDisplay; rank: number }) {
  return (
    <div className="card rounded-2xl p-4 md:p-5 lg:p-6">
      <span className="mr-2 font-semibold text-[var(--primary)]">{rank}위</span>
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
      <section className="mb-10 md:mb-12 lg:mb-14">
        <h1 className="mb-1 text-xl font-bold text-[var(--chalk)] md:text-2xl lg:text-3xl">
          오늘도 한 걸음 더
        </h1>
        <p className="text-sm text-[var(--chalk-muted)] md:text-base lg:text-lg">
          완등 기록을 확인하고 동기부여를 받아보세요.
        </p>
      </section>

      {/* 오늘의 완등자 */}
      <section className="mb-10 md:mb-12 lg:mb-14">
        <h2 className="mb-4 text-lg font-semibold text-[var(--chalk)] md:text-xl lg:text-2xl">
          오늘의 완등자
        </h2>
        <div className="flex flex-col gap-3 md:gap-4">
          {todayCompleters.length === 0 ? (
            <p className="card rounded-2xl p-6 text-center text-[var(--chalk-muted)] md:p-8 lg:p-10">
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
      <section className="mb-10 md:mb-12 lg:mb-14">
        <h2 className="mb-4 text-lg font-semibold text-[var(--chalk)] md:text-xl lg:text-2xl">
          주간 완등자
        </h2>
        <div className="flex flex-col gap-3 md:gap-4">
          {weeklyCompleters.length === 0 ? (
            <p className="card rounded-2xl p-6 text-center text-[var(--chalk-muted)] md:p-8 lg:p-10">
              이번 주 완등 기록이 없습니다.
            </p>
          ) : (
            weeklyCompleters.map((c, i) => (
              <CompleterCard key={i} c={c} rank={i + 1} />
            ))
          )}
        </div>
      </section>
    </HomeMotion>
  );
}
