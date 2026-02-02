import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { WALL_TYPE_LABELS, formatGrade } from "@/types/database";
import type { GradeDetail, GradeValue } from "@/types/database";
import { getTodayISOKST, getWeekStartEndKST, getMonthStartEndKST } from "@/lib/date";

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
  } | null;
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

function hasValidRoute(row: CompleterRow): row is CompleterRow & { route: NonNullable<CompleterRow["route"]> } {
  return row.route != null && row.route.grade_value != null && row.route.grade_detail != null;
}

function sortCompleters(
  a: CompleterRow & { route: NonNullable<CompleterRow["route"]> },
  b: CompleterRow & { route: NonNullable<CompleterRow["route"]> }
): number {
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

function toDisplay(
  row: CompleterRow & { route: NonNullable<CompleterRow["route"]> }
): CompleterDisplay {
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

/** 동일 회원·동일 루트 중복 제거 (각 목록 내에서 1건만) */
function dedupeByProfileAndRoute<T extends { profile: { id: string } | null; route: { id: string } }>(
  rows: T[]
): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = `${r.profile?.id ?? ""}-${r.route.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 기간 내 완등자 조회 (공통 로직, API·서버 양쪽에서 사용) */
export async function getCompletersInRange(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
  max = 3
): Promise<CompleterDisplay[]> {
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
    .gte("logged_at", startDate)
    .lte("logged_at", endDate);

  if (error) return [];
  const rows = normalizeCompleterRows(data ?? []).filter(hasValidRoute);
  const deduped = dedupeByProfileAndRoute(rows);
  deduped.sort(sortCompleters);
  return deduped.slice(0, max).map(toDisplay);
}

export async function getTodayCompleters(max = 3): Promise<CompleterDisplay[]> {
  const supabase = await createClient();
  const today = getTodayISOKST();
  return getCompletersInRange(supabase, today, today, max);
}

export async function getWeeklyCompleters(max = 3): Promise<CompleterDisplay[]> {
  const supabase = await createClient();
  const { start, end } = getWeekStartEndKST();
  return getCompletersInRange(supabase, start, end, max);
}

export async function getMonthlyCompleters(max = 3): Promise<CompleterDisplay[]> {
  const supabase = await createClient();
  const { start, end } = getMonthStartEndKST();
  return getCompletersInRange(supabase, start, end, max);
}
