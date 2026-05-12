"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { HomeMotion } from "@/components/HomeMotion";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { CompleterDisplay } from "@/lib/completers";
import { formatDateKST } from "@/lib/date";

const SWIPE_THRESHOLD = 50;

function CompleterCard({ c, rank }: { c: CompleterDisplay; rank: number }) {
  return (
    <div className="card rounded-2xl p-4 md:p-5 lg:p-6">
      <span className="mr-2 font-semibold text-[var(--primary)]">{rank}위</span>
      <span className="text-[var(--chalk-muted)]">{c.wallTypeLabel}</span>
      <span className="mx-2 text-[var(--border)]">|</span>
      <span className="font-medium text-[var(--chalk)]">{c.routeName}</span>
      <span className="mx-2 text-[var(--chalk-muted)]">{c.grade}</span>
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
    <section className="mb-6 md:mb-8">
      <h2 className="mb-3 text-base font-semibold text-[var(--chalk)] md:text-lg">
        {title}
      </h2>
      <div className="flex flex-col gap-2 md:gap-3">
        {loading ? (
          <p className="card rounded-2xl p-4 text-center text-[var(--chalk-muted)] md:p-6">
            조회 중...
          </p>
        ) : list.length === 0 ? (
          <p className="card rounded-2xl p-4 text-center text-[var(--chalk-muted)] md:p-6">
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
  const [attendanceKingLeaders, setAttendanceKingLeaders] = useState<{ rank: number; name: string; count: number }[]>([]);
  const [holdKingLeaders, setHoldKingLeaders] = useState<{ rank: number; name: string; count: number }[]>([]);
  const [loadingAttendanceKing, setLoadingAttendanceKing] = useState(true);
  const [loadingHoldKing, setLoadingHoldKing] = useState(true);
  type NoticeItem = { id: string; title: string; created_at: string };
  const [centerNotices, setCenterNotices] = useState<NoticeItem[]>([]);
  const [climbingNotices, setClimbingNotices] = useState<NoticeItem[]>([]);
  const [loadingNotice, setLoadingNotice] = useState(true);
  const [rankPointLeaders, setRankPointLeaders] = useState<{ rank: number; name: string; point: number }[]>([]);
  const [loadingRankPoint, setLoadingRankPoint] = useState(true);
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
    fetch("/api/completers?limit=5")
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

  useEffect(() => {
    let cancelled = false;
    fetch("/api/attendance-king")
      .then((res) => (res.ok ? res.json() : { leaders: [] }))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.leaders)) setAttendanceKingLeaders(data.leaders);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingAttendanceKing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/hold-king")
      .then((res) => (res.ok ? res.json() : { leaders: [] }))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.leaders)) setHoldKingLeaders(data.leaders);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingHoldKing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notice/latest")
      .then((res) => (res.ok ? res.json() : { center: [], climbing: [] }))
      .then((data) => {
        if (!cancelled) {
          if (Array.isArray(data?.center)) setCenterNotices(data.center);
          if (Array.isArray(data?.climbing)) setClimbingNotices(data.climbing);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingNotice(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/rank-point-leaders")
      .then((res) => (res.ok ? res.json() : { leaders: [] }))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.leaders)) setRankPointLeaders(data.leaders);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingRankPoint(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentMonthLabel = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
  });

  return (
    <HomeMotion>
      <div className="pt-4 md:pt-6">
        <div className="mb-6 md:grid md:grid-cols-2 md:gap-6">
        <section className="mb-6 md:mb-0" aria-label="센터공지">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[var(--chalk)] md:text-xl">
              센터공지
            </h2>
            <Link
              href="/notice"
              className="shrink-0 mr-2 text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
            >
              더보기
            </Link>
          </div>
          <div className="card rounded-2xl divide-y divide-[var(--border)]">
            {loadingNotice ? (
              <div className="flex items-center justify-center py-6">
                <LoadingSpinner size="md" />
              </div>
            ) : centerNotices.length === 0 ? (
              <p className="p-4 py-2 text-[var(--chalk-muted)]">공지가 없습니다.</p>
            ) : (
              centerNotices.map((notice) => (
                <div key={notice.id} className="flex flex-col gap-0.5 px-3 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:py-2">
                  <Link
                    href={`/notice/${notice.id}`}
                    className="text-sm font-medium text-[var(--chalk)] hover:underline"
                  >
                    {notice.title}
                  </Link>
                  <span className="shrink-0 text-sm text-[var(--chalk-muted)]">
                    {formatDateKST(notice.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mb-6 md:mb-0" aria-label="등반공지">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[var(--chalk)] md:text-xl">
              등반공지
            </h2>
            <Link
              href="/notice"
              className="shrink-0 mr-2 text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
            >
              더보기
            </Link>
          </div>
          <div className="card rounded-2xl divide-y divide-[var(--border)]">
            {loadingNotice ? (
              <div className="flex items-center justify-center py-6">
                <LoadingSpinner size="md" />
              </div>
            ) : climbingNotices.length === 0 ? (
              <p className="p-4 py-2 text-[var(--chalk-muted)]">공지가 없습니다.</p>
            ) : (
              climbingNotices.map((notice) => (
                <div key={notice.id} className="flex flex-col gap-0.5 px-3 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:py-2">
                  <Link
                    href={`/notice/${notice.id}`}
                    className="text-sm font-medium text-[var(--chalk)] hover:underline"
                  >
                    {notice.title}
                  </Link>
                  <span className="shrink-0 text-sm text-[var(--chalk-muted)]">
                    {formatDateKST(notice.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
        </div>

        {error && (
          <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        )}

        <section
          className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4 md:mb-8"
          aria-label="랭킹 순위 및 출석왕·홀드왕"
        >
          <div
            className="card flex flex-col rounded-2xl p-3 md:p-4"
            aria-label="랭킹 순위"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[var(--chalk)] md:text-base">
                랭킹 순위
              </h2>
              <Link
                href="/statistics/ranking"
                className="shrink-0 text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
              >
                더보기
              </Link>
            </div>
            {loadingRankPoint ? (
              <div className="flex flex-1 justify-center py-6">
                <LoadingSpinner size="md" />
              </div>
            ) : rankPointLeaders.length === 0 ? (
              <p className="py-2 text-[var(--chalk-muted)]">완등 랭크포인트 기록이 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {rankPointLeaders.map((l) => (
                  <li
                    key={l.rank}
                    className="grid grid-cols-[2rem_1fr_4.5rem] items-center gap-1 rounded-lg bg-[var(--surface-muted)]/50 px-2 py-1.5 md:px-3"
                  >
                    <span className="font-semibold text-[var(--primary)]">{l.rank}위</span>
                    <span className="truncate text-center font-medium text-[var(--chalk)]">{l.name}</span>
                    <span className="whitespace-nowrap text-right text-sm text-[var(--chalk-muted)]">{l.point}점</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 md:contents">
            <div className="card flex flex-col rounded-2xl p-3 md:p-4" aria-label={`${currentMonthLabel}의 출석왕`}>
              <h2 className="mb-2 text-sm font-semibold text-[var(--chalk)] md:text-base">
                {currentMonthLabel}의 출석왕
              </h2>
              {loadingAttendanceKing ? (
                <div className="flex flex-1 items-center justify-center py-2">
                  <LoadingSpinner size="md" />
                </div>
              ) : attendanceKingLeaders.length === 0 ? (
                <p className="py-1 text-[var(--chalk-muted)]">없음</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {attendanceKingLeaders.map((l) => (
                    <li key={l.name} className="grid grid-cols-[2rem_1fr_4rem] items-center gap-1 rounded-lg bg-[var(--surface-muted)]/50 px-2 py-1.5 md:px-3">
                      <span className="font-semibold text-[var(--primary)]">{l.rank}위</span>
                      <span className="truncate text-center font-medium text-[var(--chalk)]">{l.name}</span>
                      <span className="whitespace-nowrap text-right text-sm text-[var(--chalk-muted)]">{l.count}회</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card flex flex-col rounded-2xl p-3 md:p-4" aria-label={`${currentMonthLabel}의 홀드왕`}>
              <h2 className="mb-2 text-sm font-semibold text-[var(--chalk)] md:text-base">
                {currentMonthLabel}의 홀드왕
              </h2>
              {loadingHoldKing ? (
                <div className="flex flex-1 items-center justify-center py-2">
                  <LoadingSpinner size="md" />
                </div>
              ) : holdKingLeaders.length === 0 ? (
                <p className="py-1 text-[var(--chalk-muted)]">없음</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {holdKingLeaders.map((l) => (
                    <li key={l.name} className="grid grid-cols-[2rem_1fr_4rem] items-center gap-1 rounded-lg bg-[var(--surface-muted)]/50 px-2 py-1.5 md:px-3">
                      <span className="font-semibold text-[var(--primary)]">{l.rank}위</span>
                      <span className="truncate text-center font-medium text-[var(--chalk)]">{l.name}</span>
                      <span className="whitespace-nowrap text-right text-sm text-[var(--chalk-muted)]">{l.count}개</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

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
                  className={`relative flex flex-1 items-center justify-center py-2 text-sm font-medium transition md:py-3 ${
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
          <div className="px-3 py-3 md:px-4 md:py-4">
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
