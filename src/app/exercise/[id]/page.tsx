import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WALL_TYPE_LABELS, formatGrade } from "@/types/database";
import type { GradeDetail, GradeValue } from "@/types/database";
import ExerciseLogEdit from "../ExerciseLogEdit";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/exercise/" + id);

  const { data: log, error } = await supabase
    .from("exercise_logs")
    .select(
      `
      id,
      profile_id,
      route_id,
      progress_hold_count,
      attempt_count,
      is_completed,
      is_round_trip,
      round_trip_count,
      logged_at,
      route:routes(id, wall_type, grade_value, grade_detail, name, hold_count)
    `
    )
    .eq("id", id)
    .single();

  const profileId = (log as { profile_id: string })?.profile_id;
  if (error || !log) notFound();
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = myProfile?.role === "admin";
  if (profileId !== user.id && !isAdmin) notFound();

  const raw = log as unknown as {
    id: string;
    profile_id: string;
    route_id: string;
    progress_hold_count: number;
    attempt_count: number;
    is_completed: boolean;
    is_round_trip: boolean;
    round_trip_count: number;
    logged_at: string;
    route:
      | { id: string; wall_type: string; grade_value: GradeValue; grade_detail: GradeDetail; name: string; hold_count: number }
      | { id: string; wall_type: string; grade_value: GradeValue; grade_detail: GradeDetail; name: string; hold_count: number }[];
  };
  const route = Array.isArray(raw.route) ? raw.route[0] : raw.route;
  if (!route) notFound();
  const row = { ...raw, route };

  const wallLabel =
    WALL_TYPE_LABELS[row.route.wall_type as keyof typeof WALL_TYPE_LABELS] ??
    row.route.wall_type;
  const grade = formatGrade(row.route.grade_value, row.route.grade_detail);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">
        운동일지 상세
      </h1>
      <div className="card rounded-2xl p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-[var(--chalk-muted)]">운동일</dt>
            <dd className="font-medium text-[var(--chalk)]">
              {row.logged_at}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--chalk-muted)]">암벽구분</dt>
            <dd className="font-medium text-[var(--chalk)]">
              {wallLabel}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--chalk-muted)]">루트명</dt>
            <dd className="font-medium text-[var(--chalk)]">
              {row.route.name}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--chalk-muted)]">난이도</dt>
            <dd className="font-medium text-[var(--chalk)]">
              {grade}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--chalk-muted)]">홀드수</dt>
            <dd className="font-medium text-[var(--chalk)]">
              {row.progress_hold_count} / {row.route.hold_count}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--chalk-muted)]">등반횟수</dt>
            <dd className="font-medium text-[var(--chalk)]">
              {row.attempt_count}회
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--chalk-muted)]">완등여부</dt>
            <dd className="font-medium text-[var(--chalk)]">
              {row.is_completed ? "완등" : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--chalk-muted)]">왕복</dt>
            <dd className="font-medium text-[var(--chalk)]">
              {row.is_round_trip ? `왕복 ${row.round_trip_count}회` : "-"}
            </dd>
          </div>
        </dl>
        {profileId === user.id && (
          <div className="mt-6">
            <ExerciseLogEdit
              logId={row.id}
              profileId={row.profile_id}
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
          </div>
        )}
      </div>
      <p className="mt-6">
        <Link
          href={profileId === user.id ? "/exercise" : `/exercise/members?profileId=${encodeURIComponent(profileId)}`}
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          목록으로
        </Link>
      </p>
    </div>
  );
}
