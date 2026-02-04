"use client";

import { useState, useEffect, useRef } from "react";
import { HomeMotion } from "@/components/HomeMotion";
import type { CompleterDisplay } from "@/lib/completers";

const SWIPE_THRESHOLD = 50;

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

function CompleterSection({
  title,
  list,
  emptyText,
  loading,
}: {
  title: string;
  list: CompleterDisplay[];
  emptyText: string;
  loading: boolean;
}) {
  return (
    <section className="mb-10 md:mb-12 lg:mb-14">
      <h2 className="mb-4 text-lg font-semibold text-[var(--chalk)] md:text-xl lg:text-2xl">
        {title}
      </h2>
      <div className="flex flex-col gap-3 md:gap-4">
        {loading ? (
          <p className="card rounded-2xl p-6 text-center text-[var(--chalk-muted)] md:p-8 lg:p-10">
            조회 중...
          </p>
        ) : list.length === 0 ? (
          <p className="card rounded-2xl p-6 text-center text-[var(--chalk-muted)] md:p-8 lg:p-10">
            {emptyText}
          </p>
        ) : (
          list.map((c, i) => <CompleterCard key={i} c={c} rank={i + 1} />)
        )}
      </div>
    </section>
  );
}

type Segment = "today" | "weekly" | "monthly";

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: "today", label: "오늘의 완등자" },
  { key: "weekly", label: "주간 완등자" },
  { key: "monthly", label: "월간 완등자" },
];

export default function Home() {
  const [segment, setSegment] = useState<Segment>("today");
  const [today, setToday] = useState<CompleterDisplay[]>([]);
  const [weekly, setWeekly] = useState<CompleterDisplay[]>([]);
  const [monthly, setMonthly] = useState<CompleterDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const justSwiped = useRef(false);

  function goToSegment(index: number) {
    const next = SEGMENTS[Math.max(0, Math.min(index, SEGMENTS.length - 1))];
    setSegment(next.key);
  }

  function handleSegmentSwipe(deltaX: number) {
    const currentIndex = SEGMENTS.findIndex((s) => s.key === segment);
    if (deltaX < -SWIPE_THRESHOLD && currentIndex < SEGMENTS.length - 1) {
      goToSegment(currentIndex + 1);
      justSwiped.current = true;
      setTimeout(() => {
        justSwiped.current = false;
      }, 300);
    } else if (deltaX > SWIPE_THRESHOLD && currentIndex > 0) {
      goToSegment(currentIndex - 1);
      justSwiped.current = true;
      setTimeout(() => {
        justSwiped.current = false;
      }, 300);
    }
  }

  function handleSegmentClick(key: Segment) {
    if (justSwiped.current) return;
    setSegment(key);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/completers?limit=3")
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setToday(Array.isArray(data.today) ? data.today : []);
        setWeekly(Array.isArray(data.weekly) ? data.weekly : []);
        setMonthly(Array.isArray(data.monthly) ? data.monthly : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "조회에 실패했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <HomeMotion>
      <div className="pt-4 md:pt-6">
        {error && (
          <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        )}

        <section
          className="card rounded-2xl overflow-hidden touch-pan-y"
          style={{ touchAction: "pan-y" }}
          aria-label="완등자"
          onTouchStart={(e) => {
            touchStartX.current = e.targetTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current == null) return;
            const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
            const deltaX = endX - touchStartX.current;
            handleSegmentSwipe(deltaX);
            touchStartX.current = null;
          }}
        >
          <div
            className="border-b border-[var(--border)]"
            role="tablist"
            aria-label="완등자 기간 선택"
          >
            <div className="flex">
              {SEGMENTS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={segment === key}
                  onClick={() => handleSegmentClick(key)}
                  className={`relative flex flex-1 items-center justify-center py-3 text-sm font-medium transition md:py-4 md:text-base ${
                    segment === key
                      ? "text-[var(--chalk)]"
                      : "text-[var(--chalk-muted)] hover:text-[var(--chalk)]"
                  }`}
                >
                  <span>{label}</span>
                  {segment === key && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
                      aria-hidden
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="px-4 py-4 md:px-5 md:py-5">
            {segment === "today" && (
              <CompleterSection
                title="오늘의 완등자"
                list={today}
                emptyText="오늘 완등 기록이 없습니다."
                loading={loading}
              />
            )}
            {segment === "weekly" && (
              <CompleterSection
                title="주간 완등자"
                list={weekly}
                emptyText="이번 주 완등 기록이 없습니다."
                loading={loading}
              />
            )}
            {segment === "monthly" && (
              <CompleterSection
                title="월간 완등자"
                list={monthly}
                emptyText="이번 달 완등 기록이 없습니다."
                loading={loading}
              />
            )}
          </div>
        </section>
      </div>
    </HomeMotion>
  );
}
