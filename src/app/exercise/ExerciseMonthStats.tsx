"use client";

import { useState } from "react";

type WeekDatum = {
  date: string;
  dayLabel: string;
  shortDate: string;
  holds: number;
};

type Props = {
  totalHolds: number;
  averageHolds: number;
  maxDailyHolds: number;
  routeCount: number;
  weekData: WeekDatum[];
};

export default function ExerciseMonthStats({
  totalHolds,
  averageHolds,
  maxDailyHolds,
  routeCount,
  weekData,
}: Props) {
  const [weekGraphOpen, setWeekGraphOpen] = useState(false);

  const items = [
    { label: "진행한 홀드 수", value: totalHolds, unit: "개" },
    { label: "평균 진행한 홀드 수", value: averageHolds, unit: "개" },
    { label: "최대 진행한 홀드 수", value: maxDailyHolds, unit: "개" },
    { label: "진행한 루트 수", value: routeCount, unit: "개" },
  ];

  const maxHolds = Math.max(1, ...weekData.map((d) => d.holds));

  return (
    <section className="card rounded-2xl p-4 md:p-5" aria-label="이달의 운동량">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--chalk)] md:text-lg">
          이달의 운동량
        </h2>
        <button
          type="button"
          onClick={() => setWeekGraphOpen(true)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--chalk)] hover:bg-[var(--surface-muted)]"
        >
          WeekGraph
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(({ label, value, unit }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
          >
            <dt className="text-xs font-medium text-[var(--chalk-muted)]">
              {label}
            </dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--chalk)] md:text-xl">
              {typeof value === "number" && value % 1 !== 0
                ? value.toFixed(1)
                : value}
              <span className="ml-1 text-sm font-normal text-[var(--chalk-muted)]">
                {unit}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      {weekGraphOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            aria-hidden
            onClick={() => setWeekGraphOpen(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="week-graph-title"
          >
            <h3
              id="week-graph-title"
              className="mb-4 text-base font-semibold text-[var(--chalk)]"
            >
              한 주 진행 홀드 수
            </h3>
            <div className="flex items-end justify-between gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 pt-8">
              {weekData.map((d) => (
                <div
                  key={d.date}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <span
                    className="w-full rounded-t bg-[var(--primary)] transition-all"
                    style={{
                      height: `${Math.max(4, (d.holds / maxHolds) * 120)}px`,
                      minWidth: "24px",
                    }}
                    title={`${d.dayLabel} ${d.shortDate}: ${d.holds}개`}
                  />
                  <span className="text-xs font-medium text-[var(--chalk)]">
                    {d.holds}
                  </span>
                  <span className="text-xs text-[var(--chalk-muted)]">
                    {d.dayLabel}
                  </span>
                  <span className="text-[10px] text-[var(--chalk-muted)]">
                    {d.shortDate}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-[var(--chalk-muted)]">
              요일별 진행한 홀드 수 (이번 주 월~일)
            </p>
            <button
              type="button"
              onClick={() => setWeekGraphOpen(false)}
              className="mt-4 w-full rounded-xl bg-[var(--primary)] py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              닫기
            </button>
          </div>
        </>
      )}
    </section>
  );
}
