import { createClient } from "@/lib/supabase/server";
import type { GradeDetail, GradeValue } from "@/types/database";

export type LogRow = {
  id: string;
  profile_id: string;
  route_id: string;
  progress_hold_count: number;
  is_completed: boolean;
  logged_at: string;
  route: {
    id: string;
    name: string;
    wall_type: string;
    grade_value: GradeValue;
    grade_detail: GradeDetail;
    hold_count: number;
  };
  profile: { id: string; name: string } | null;
};

export async function getExerciseLogsForStatistics(): Promise<LogRow[]> {
  const supabase = await createClient();
  const { data: logsRaw } = await supabase
    .from("exercise_logs")
    .select(
      `
      id,
      profile_id,
      route_id,
      progress_hold_count,
      is_completed,
      logged_at,
      route:routes(id, name, wall_type, grade_value, grade_detail, hold_count),
      profile:profiles(id, name)
    `
    );

  type RawRow = LogRow & {
    route: LogRow["route"] | LogRow["route"][];
    profile: LogRow["profile"] | NonNullable<LogRow["profile"]>[];
  };
  return ((logsRaw ?? []) as unknown as RawRow[]).map((r) => ({
    ...r,
    route: Array.isArray(r.route) ? r.route[0] : r.route,
    profile: Array.isArray(r.profile) ? r.profile[0] ?? null : r.profile,
  })) as LogRow[];
}
