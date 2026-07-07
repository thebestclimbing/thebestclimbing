import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMonthStartEndKST, getWeekStartEndKST } from "@/lib/date";
import type { GradeDetail, GradeValue } from "@/types/database";
import ExerciseLogSection from "./ExerciseLogSection";
import ExerciseMonthStats from "./ExerciseMonthStats";

export default async function ExercisePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/exercise");

  const { data: logsRaw } = await supabase
    .from("exercise_logs")
    .select(
      `
      id,
      progress_hold_count,
      attempt_count,
      is_completed,
      completion_requested,
      is_round_trip,
      round_trip_count,
      logged_at,
      memo,
      route:routes(id, wall_type, grade_value, grade_detail, name, hold_count)
    `
    )
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  type LogItem = {
    id: string;
    progress_hold_count: number;
    attempt_count: number;
    is_completed: boolean;
    completion_requested: boolean;
    is_round_trip: boolean;
    round_trip_count: number;
    logged_at: string;
    memo: string | null;
    route: {
      id: string;
      wall_type: string;
      grade_value: GradeValue;
      grade_detail: GradeDetail;
      name: string;
      hold_count: number;
    };
  };
  const logs = (logsRaw ?? []).map((l: unknown) => {
    const r = l as LogItem & { route: LogItem["route"] | LogItem["route"][]; completion_requested?: boolean; memo?: string | null };
    return {
      ...r,
      route: Array.isArray(r.route) ? r.route[0] : r.route,
      completion_requested: r.completion_requested ?? false,
      memo: r.memo ?? null,
    } as LogItem;
  });

  const { data: routes } = await supabase
    .from("routes")
    .select("id, wall_type, grade_value, grade_detail, name, hold_count")
    .order("name");

  // 현재 유저가 참여 중인 활성 이벤트의 루트 ID
  const today = new Date().toISOString().slice(0, 10)
  const { data: participations } = await supabase
    .from("event_participants")
    .select("route_id, events(status, start_date, end_date)")
    .eq("user_id", user.id)
    .not("route_id", "is", null)
  type EventInfo = { status: string; start_date: string; end_date: string }
  type ParticipationRow = { route_id: string; events: EventInfo | EventInfo[] | null }
  const eventRouteIds = ((participations ?? []) as unknown as ParticipationRow[])
    .filter((p) => {
      const e = Array.isArray(p.events) ? p.events[0] : p.events
      return e && e.status === "active" && e.start_date <= today && e.end_date >= today
    })
    .map((p) => p.route_id)

  // 이달의 운동량 (한국 시간 기준 이번 달)
  const { start: monthStart, end: monthEnd } = getMonthStartEndKST();
  const { data: monthLogsRaw } = await supabase
    .from("exercise_logs")
    .select("progress_hold_count, logged_at")
    .eq("profile_id", user.id)
    .gte("logged_at", monthStart)
    .lte("logged_at", monthEnd);
  const monthLogs = (monthLogsRaw ?? []) as { progress_hold_count: number; logged_at: string }[];
  const totalHolds = monthLogs.reduce((s, l) => s + l.progress_hold_count, 0);
  const holdsByDay: Record<string, number> = {};
  for (const l of monthLogs) {
    holdsByDay[l.logged_at] = (holdsByDay[l.logged_at] ?? 0) + l.progress_hold_count;
  }
  const maxDailyHolds = Object.values(holdsByDay).reduce((m, v) => Math.max(m, v), 0);
  const routeCount = monthLogs.length;

  // 이달 출석 횟수 (attendances 테이블)
  const { count: attendanceCount } = await supabase
    .from("attendances")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .gte("attended_at", monthStart)
    .lte("attended_at", monthEnd);
  const monthAttendanceCount = attendanceCount ?? 0;
  const averageHolds =
    monthAttendanceCount > 0 ? totalHolds / monthAttendanceCount : 0;

  // 최근 4주 단위 진행 홀드 (월~일, 요일별 합계)
  const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
  const { start: currentWeekStart } = getWeekStartEndKST(); // 이번 주 월요일

  function addDaysIso(baseIso: string, days: number): string {
    const d = new Date(baseIso + "T12:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  // 최근 4주 월요일들 (0: 이번 주, 1: 1주 전, 2: 2주 전, 3: 3주 전)
  const mondayIsos: string[] = [];
  for (let i = 0; i < 4; i++) {
    mondayIsos.push(addDaysIso(currentWeekStart, -7 * i));
  }
  const earliestMonday = mondayIsos[3];
  const latestSunday = addDaysIso(currentWeekStart, 6);

  const { data: weekLogsRaw } = await supabase
    .from("exercise_logs")
    .select("progress_hold_count, logged_at")
    .eq("profile_id", user.id)
    .gte("logged_at", earliestMonday)
    .lte("logged_at", latestSunday);
  const allWeekLogs = (weekLogsRaw ?? []) as { progress_hold_count: number; logged_at: string }[];

  const holdsByDate: Record<string, number> = {};
  for (const l of allWeekLogs) {
    holdsByDate[l.logged_at] = (holdsByDate[l.logged_at] ?? 0) + l.progress_hold_count;
  }

  const weekSummaries = mondayIsos.map((mondayIso, index) => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDaysIso(mondayIso, i));
    }
    const data = dates.map((date, i) => ({
      date,
      dayLabel: DAY_LABELS[i],
      shortDate: date.slice(5).replace("-", "/"),
      holds: holdsByDate[date] ?? 0,
    }));
    const startLabel = dates[0].slice(5).replace("-", "/");
    const endLabel = dates[6].slice(5).replace("-", "/");
    const label = index === 0 ? "이번 주" : `${index}주 전`;
    const rangeLabel = `${startLabel} ~ ${endLabel}`;
    return { label, rangeLabel, data };
  });

  // 루트별 완등 인증일 (가장 이른 완등일 1건) — 이 날짜 이후 기록에만 '완등 인증됨' 표시
  const completedRouteIdToDate: Record<string, string> = {};
  for (const l of logs) {
    if (!l.is_completed) continue;
    const id = l.route.id;
    const date = l.logged_at;
    if (!(id in completedRouteIdToDate) || date < completedRouteIdToDate[id]) {
      completedRouteIdToDate[id] = date;
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:max-w-5xl lg:px-6 lg:py-10 xl:max-w-6xl xl:px-8 xl:py-12">
      <ExerciseLogSection
        profileId={user.id}
        routes={routes ?? []}
        completedRouteIds={Array.from(new Set(logs.filter((l) => l.is_completed).map((l) => l.route.id)))}
        eventRouteIds={eventRouteIds}
        logs={logs}
        completedRouteIdToDate={completedRouteIdToDate}
      >
        <section className="mt-8 lg:mt-10">
          <ExerciseMonthStats
            totalHolds={totalHolds}
            averageHolds={averageHolds}
            maxDailyHolds={maxDailyHolds}
            routeCount={routeCount}
            attendanceCount={monthAttendanceCount}
            weekSummaries={weekSummaries}
          />
        </section>
      </ExerciseLogSection>
      <p className="mt-6 lg:mt-8">
        <Link
          href="/"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)] md:text-base"
        >
          메인으로
        </Link>
      </p>
    </div>
  );
}
