import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WALL_TYPE_LABELS, formatGrade } from "@/types/database";
import type { GradeDetail, GradeValue } from "@/types/database";
import ExerciseLogAddSection from "./ExerciseLogAddSection";
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
    const r = l as LogItem & { route: LogItem["route"] | LogItem["route"][]; completion_requested?: boolean };
    return {
      ...r,
      route: Array.isArray(r.route) ? r.route[0] : r.route,
      completion_requested: r.completion_requested ?? false,
    } as LogItem;
  });

  const { data: routes } = await supabase
    .from("routes")
    .select("id, wall_type, grade_value, grade_detail, name, hold_count")
    .order("name");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ExerciseLogAddSection
        profileId={user.id}
        routes={routes ?? []}
      />
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-[var(--chalk)]">
          기록 목록
        </h2>
        <ExerciseLogList logs={logs} profileId={user.id} />
      </section>
      <p className="mt-6">
        <Link
          href="/"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          메인으로
        </Link>
      </p>
    </div>
  );
}
