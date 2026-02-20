"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SubmitButton } from "@/components/SubmitButton";
import { RouteSelect } from "@/components/RouteSelect";

interface RouteRow {
  id: string;
  wall_type: string;
  grade_value: string;
  grade_detail: string;
  name: string;
  hold_count: number;
}

export default function ExerciseLogForm({
  profileId,
  routes,
  completedRouteIds = [],
  onSuccess,
}: {
  profileId: string;
  routes: RouteRow[];
  completedRouteIds?: string[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [routeId, setRouteId] = useState("");
  const [progressHoldCountStr, setProgressHoldCountStr] = useState("");
  const [attemptCountStr, setAttemptCountStr] = useState("1");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [roundTripCount, setRoundTripCount] = useState(0);
  const [loggedAt, setLoggedAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!routeId) {
      setError("루트를 선택해 주세요.");
      return;
    }
    const progressHoldCount = Math.max(0, parseInt(progressHoldCountStr, 10) || 0);
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("exercise_logs").insert({
      profile_id: profileId,
      route_id: routeId,
      progress_hold_count: progressHoldCount,
      attempt_count: Math.max(1, parseInt(attemptCountStr, 10) || 1),
      is_completed: false,
      completion_requested: false,
      is_round_trip: isRoundTrip,
      round_trip_count: roundTripCount,
      logged_at: loggedAt,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
    setRouteId("");
    setProgressHoldCountStr("");
    setAttemptCountStr("1");
    setIsRoundTrip(false);
    setRoundTripCount(0);
    setLoggedAt(new Date().toISOString().slice(0, 10));
    onSuccess?.();
  }

  const isRouteAlreadyCompleted = routeId ? completedRouteIds.includes(routeId) : false;

  return (
    <form onSubmit={handleSubmit} className="card rounded-2xl p-6">
      <h2 className="mb-4 text-lg font-semibold text-[var(--chalk)]">새 기록</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">루트 *</label>
          {isRouteAlreadyCompleted && (
            <span className="mb-1.5 inline-block rounded border border-[var(--border)] bg-white px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-green-400">
              ✓ 완등 인증됨
            </span>
          )}
          <RouteSelect
            routes={routes}
            value={routeId}
            onChange={setRouteId}
            onSelectRoute={(r) => setProgressHoldCountStr(String(r.hold_count))}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">운동일 *</label>
          <input type="date" value={loggedAt} onChange={(e) => setLoggedAt(e.target.value)} required className="input-base" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">진행한 홀드수</label>
          <input
            type="text"
            inputMode="numeric"
            min={0}
            value={progressHoldCountStr}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              if (v === "" || Number(v) >= 0) setProgressHoldCountStr(v);
            }}
            placeholder="0"
            className="input-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">등반횟수</label>
          <input type="number" min={1} value={attemptCountStr} onChange={(e) => setAttemptCountStr(e.target.value)} className="input-base" />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" id="isRoundTrip" checked={isRoundTrip} onChange={(e) => setIsRoundTrip(e.target.checked)} className="rounded border-[var(--border)]" />
          <label htmlFor="isRoundTrip" className="text-sm text-[var(--chalk)]">왕복</label>
        </div>
        {isRoundTrip && (
          <div>
            <label className="mb-1 block text-sm text-[var(--chalk-muted)]">왕복횟수</label>
            <input type="number" min={0} value={roundTripCount} onChange={(e) => setRoundTripCount(Number(e.target.value))} className="input-base" />
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4">
        <SubmitButton
          loading={loading}
          loadingLabel="저장 중..."
          className="btn-primary disabled:pointer-events-none"
        >
          저장
        </SubmitButton>
      </div>
    </form>
  );
}
