"use server";

import { createClient } from "@/lib/supabase/server";
import { getMonthStartEndKST, getWeekStartEndKST } from "@/lib/date";
import type { GradeDetail, GradeValue } from "@/types/database";

function addDaysIso(baseIso: string, days: number): string {
  const d = new Date(baseIso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export type MemberLogItem = {
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

export type WeekDatum = { date: string; dayLabel: string; shortDate: string; holds: number };
export type WeekSummary = { label: string; rangeLabel: string; data: WeekDatum[] };

export type MemberExerciseData =
  | { ok: true; profile: { id: string; name: string }; totalHolds: number; averageHolds: number; maxDailyHolds: number; routeCount: number; attendanceCount: number; weekSummaries: WeekSummary[]; logs: MemberLogItem[]; completedRouteIdToDate: Record<string, string> }
  | { ok: false; error: string };

export async function getMemberExerciseData(profileId: string): Promise<MemberExerciseData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (myProfile?.role !== "admin") return { ok: false, error: "forbidden" };

  const { start: monthStart, end: monthEnd } = getMonthStartEndKST();
  const { start: currentWeekStart } = getWeekStartEndKST();
  const mondayIsos: string[] = [];
  for (let i = 0; i < 4; i++) mondayIsos.push(addDaysIso(currentWeekStart, -7 * i));
  const earliestMonday = mondayIsos[3];
  const latestSunday = addDaysIso(currentWeekStart, 6);
  const statsRangeEnd = monthEnd > latestSunday ? monthEnd : latestSunday;

  const [profileRes, logsRes, dateRangeLogsRes, attendanceRes] = await Promise.all([
    supabase.from("profiles").select("id, name").eq("id", profileId).single(),
    supabase
      .from("exercise_logs")
      .select(
        "id, progress_hold_count, attempt_count, is_completed, completion_requested, is_round_trip, round_trip_count, logged_at, memo, route:routes(id, wall_type, grade_value, grade_detail, name, hold_count)"
      )
      .eq("profile_id", profileId)
      .order("logged_at", { ascending: false })
      .limit(500),
    supabase
      .from("exercise_logs")
      .select("progress_hold_count, logged_at")
      .eq("profile_id", profileId)
      .gte("logged_at", earliestMonday)
      .lte("logged_at", statsRangeEnd),
    supabase
      .from("attendances")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .gte("attended_at", monthStart)
      .lte("attended_at", monthEnd),
  ]);

  const profile = profileRes.data;
  if (!profile) return { ok: false, error: "not_found" };

  const logsRaw = logsRes.data ?? [];
  const logs: MemberLogItem[] = logsRaw.map((l: unknown) => {
    const r = l as MemberLogItem & { route: MemberLogItem["route"] | MemberLogItem["route"][] };
    return {
      ...r,
      route: Array.isArray(r.route) ? r.route[0] : r.route,
      completion_requested: r.completion_requested ?? false,
      memo: r.memo ?? null,
    } as MemberLogItem;
  });

  const dateRangeLogs = (dateRangeLogsRes.data ?? []) as { progress_hold_count: number; logged_at: string }[];
  const monthLogs = dateRangeLogs.filter((l) => l.logged_at >= monthStart && l.logged_at <= monthEnd);
  const totalHolds = monthLogs.reduce((s, l) => s + l.progress_hold_count, 0);
  const holdsByDay: Record<string, number> = {};
  for (const l of monthLogs) holdsByDay[l.logged_at] = (holdsByDay[l.logged_at] ?? 0) + l.progress_hold_count;
  const maxDailyHolds = Object.values(holdsByDay).reduce((m, v) => Math.max(m, v), 0);
  const routeCount = monthLogs.length;
  const attendanceCount = attendanceRes.count ?? 0;
  const averageHolds = attendanceCount > 0 ? totalHolds / attendanceCount : 0;

  const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
  const allWeekLogs = dateRangeLogs.filter((l) => l.logged_at >= earliestMonday && l.logged_at <= latestSunday);
  const holdsByDate: Record<string, number> = {};
  for (const l of allWeekLogs) holdsByDate[l.logged_at] = (holdsByDate[l.logged_at] ?? 0) + l.progress_hold_count;
  const weekSummaries: WeekSummary[] = mondayIsos.map((mondayIso, index) => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) dates.push(addDaysIso(mondayIso, i));
    const data = dates.map((date, i) => ({
      date,
      dayLabel: DAY_LABELS[i],
      shortDate: date.slice(5).replace("-", "/"),
      holds: holdsByDate[date] ?? 0,
    }));
    const startLabel = dates[0].slice(5).replace("-", "/");
    const endLabel = dates[6].slice(5).replace("-", "/");
    return {
      label: index === 0 ? "이번 주" : `${index}주 전`,
      rangeLabel: `${startLabel} ~ ${endLabel}`,
      data,
    };
  });

  const completedRouteIdToDate: Record<string, string> = {};
  for (const l of logs) {
    if (!l.is_completed) continue;
    const id = l.route.id;
    const date = l.logged_at;
    if (!(id in completedRouteIdToDate) || date < completedRouteIdToDate[id]) completedRouteIdToDate[id] = date;
  }

  return {
    ok: true,
    profile: { id: profile.id, name: profile.name },
    totalHolds,
    averageHolds,
    maxDailyHolds,
    routeCount,
    attendanceCount,
    weekSummaries,
    logs,
    completedRouteIdToDate,
  };
}
