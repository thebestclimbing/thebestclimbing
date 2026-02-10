import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMonthStartEndKST, getWeekStartEndKST } from "@/lib/date";
import type { GradeDetail, GradeValue } from "@/types/database";
import ExerciseLogAddSection from "./ExerciseLogAddSection";
import ExerciseMonthStats from "./ExerciseMonthStats";
import ExerciseLogList from "./ExerciseLogList";

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
    .order("logged_at", { ascending: false })
    .limit(100);

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
  const attendanceDays = new Set(monthLogs.map((l) => l.logged_at)).size;
  const averageHolds = attendanceDays > 0 ? totalHolds / attendanceDays : 0;
  const holdsByDay: Record<string, number> = {};
  for (const l of monthLogs) {
    holdsByDay[l.logged_at] = (holdsByDay[l.logged_at] ?? 0) + l.progress_hold_count;
  }
  const maxDailyHolds = Object.values(holdsByDay).reduce((m, v) => Math.max(m, v), 0);
  const routeCount = monthLogs.length;

  // 한 주 단위 진행 홀드 (월~일, 요일별 합계)
  const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
  const { start: weekStart } = getWeekStartEndKST();
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart + "T12:00:00");
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().slice(0, 10));
  }
  const weekEnd = weekDates[6];
  const { data: weekLogsRaw } = await supabase
    .from("exercise_logs")
    .select("progress_hold_count, logged_at")
    .eq("profile_id", user.id)
    .gte("logged_at", weekStart)
    .lte("logged_at", weekEnd);
  const weekLogs = (weekLogsRaw ?? []) as { progress_hold_count: number; logged_at: string }[];
  const holdsByWeekDay: Record<string, number> = {};
  for (const d of weekDates) holdsByWeekDay[d] = 0;
  for (const l of weekLogs) {
    holdsByWeekDay[l.logged_at] = (holdsByWeekDay[l.logged_at] ?? 0) + l.progress_hold_count;
  }
  const weekData = weekDates.map((date, i) => ({
    date,
    dayLabel: DAY_LABELS[i],
    shortDate: date.slice(5).replace("-", "/"),
    holds: holdsByWeekDay[date] ?? 0,
  }));

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
      <ExerciseLogAddSection
        profileId={user.id}
        routes={routes ?? []}
        completedRouteIds={Array.from(new Set(logs.filter((l) => l.is_completed).map((l) => l.route.id)))}
      />
      <section className="mt-8 lg:mt-10">
        <ExerciseMonthStats
          totalHolds={totalHolds}
          averageHolds={averageHolds}
          maxDailyHolds={maxDailyHolds}
          routeCount={routeCount}
          weekData={weekData}
        />
      </section>
      <section className="mt-8 lg:mt-10">
        <h2 className="mb-4 text-lg font-semibold text-[var(--chalk)] md:text-xl lg:text-2xl">
          기록 목록
        </h2>
        <ExerciseLogList
          logs={logs}
          profileId={user.id}
          completedRouteIdToDate={completedRouteIdToDate}
        />
      </section>
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
