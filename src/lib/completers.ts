import { createClient } from "@/lib/supabase/server";
import { WALL_TYPE_LABELS, formatGrade } from "@/types/database";
import type { GradeDetail, GradeValue } from "@/types/database";

export interface CompleterRow {
  id: string;
  logged_at: string;
  route: {
    id: string;
    wall_type: string;
    grade_value: GradeValue;
    grade_detail: GradeDetail;
    name: string;
    hold_count: number;
  };
  profile: { id: string; name: string } | null;
}

export interface CompleterDisplay {
  wallTypeLabel: string;
  routeName: string;
  grade: string;
  memberName: string;
}

const GRADE_ORDER: GradeValue[] = ["5.9", "10", "11", "12", "13"];
const DETAIL_ORDER: GradeDetail[] = ["a", "b", "c", "d"];

function gradeRank(gradeValue: GradeValue, gradeDetail: GradeDetail): number {
  const v = GRADE_ORDER.indexOf(gradeValue);
  const d = DETAIL_ORDER.indexOf(gradeDetail);
  return v * 10 + d;
}

function sortCompleters(a: CompleterRow, b: CompleterRow): number {
  const rankA = gradeRank(
    a.route.grade_value as GradeValue,
    a.route.grade_detail as GradeDetail
  );
  const rankB = gradeRank(
    b.route.grade_value as GradeValue,
    b.route.grade_detail as GradeDetail
  );
  return rankB - rankA;
}

function toDisplay(row: CompleterRow): CompleterDisplay {
  const wallTypeLabel =
    WALL_TYPE_LABELS[row.route.wall_type as keyof typeof WALL_TYPE_LABELS] ?? row.route.wall_type;
  return {
    wallTypeLabel,
    routeName: row.route.name,
    grade: formatGrade(
      row.route.grade_value as GradeValue,
      row.route.grade_detail as GradeDetail
    ),
    memberName: row.profile?.name ?? "-",
  };
}

function normalizeCompleterRows(
  data: unknown[]
): CompleterRow[] {
  const raw = data as Array<{
    id: string;
    logged_at: string;
    route: CompleterRow["route"] | CompleterRow["route"][];
    profile: CompleterRow["profile"] | (CompleterRow["profile"] extends null ? never : NonNullable<CompleterRow["profile"]>[]) | null;
  }>;
  return raw.map((r) => ({
    ...r,
    route: Array.isArray(r.route) ? r.route[0] : r.route,
    profile: Array.isArray(r.profile) ? r.profile[0] ?? null : r.profile,
  })) as CompleterRow[];
}

function getTodayISO(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getWeekStartEnd(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const start = monday.toISOString().slice(0, 10);
  const end = now.toISOString().slice(0, 10);
  return { start, end };
}

export async function getTodayCompleters(max = 3): Promise<CompleterDisplay[]> {
  const supabase = await createClient();
  const today = getTodayISO();
  const { data, error } = await supabase
    .from("exercise_logs")
    .select(
      `
      id,
      logged_at,
      route:routes(id, wall_type, grade_value, grade_detail, name, hold_count),
      profile:profiles(id, name)
    `
    )
    .eq("is_completed", true)
    .eq("logged_at", today);

  if (error) return [];
  const rows = normalizeCompleterRows(data ?? []);
  rows.sort(sortCompleters);
  return rows.slice(0, max).map(toDisplay);
}

export async function getWeeklyCompleters(max = 3): Promise<CompleterDisplay[]> {
  const supabase = await createClient();
  const { start, end } = getWeekStartEnd();
  const { data, error } = await supabase
    .from("exercise_logs")
    .select(
      `
      id,
      logged_at,
      route:routes(id, wall_type, grade_value, grade_detail, name, hold_count),
      profile:profiles(id, name)
    `
    )
    .eq("is_completed", true)
    .gte("logged_at", start)
    .lte("logged_at", end);

  if (error) return [];
  const rows = normalizeCompleterRows(data ?? []);
  rows.sort(sortCompleters);
  return rows.slice(0, max).map(toDisplay);
}
