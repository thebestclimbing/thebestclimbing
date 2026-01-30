import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExerciseLogUpdateForm from "../../ExerciseLogUpdateForm";

export default async function ExerciseLogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/exercise/" + id + "/edit");

  const { data: log, error } = await supabase
    .from("exercise_logs")
    .select(
      "id, profile_id, route_id, progress_hold_count, attempt_count, is_completed, is_round_trip, round_trip_count, logged_at"
    )
    .eq("id", id)
    .single();

  if (error || !log || (log as { profile_id: string }).profile_id !== user.id) {
    notFound();
  }

  const { data: routes } = await supabase
    .from("routes")
    .select("id, name, hold_count")
    .order("name");

  const row = log as {
    id: string;
    profile_id: string;
    route_id: string;
    progress_hold_count: number;
    attempt_count: number;
    is_completed: boolean;
    is_round_trip: boolean;
    round_trip_count: number;
    logged_at: string;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        운동일지 수정
      </h1>
      <ExerciseLogUpdateForm
        logId={row.id}
        profileId={row.profile_id}
        routes={routes ?? []}
        initial={{
          route_id: row.route_id,
          progress_hold_count: row.progress_hold_count,
          attempt_count: row.attempt_count,
          is_completed: row.is_completed,
          is_round_trip: row.is_round_trip,
          round_trip_count: row.round_trip_count,
          logged_at: row.logged_at,
        }}
      />
      <p className="mt-6">
        <Link
          href={"/exercise/" + id}
          className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          상세로
        </Link>
      </p>
    </div>
  );
}
