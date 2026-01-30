"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SubmitButton } from "@/components/SubmitButton";
import { RouteSelect } from "@/components/RouteSelect";

interface RouteRow {
  id: string;
  name: string;
  hold_count: number;
}

interface Initial {
  route_id: string;
  progress_hold_count: number;
  attempt_count: number;
  is_completed?: boolean;
  is_round_trip: boolean;
  round_trip_count: number;
  logged_at: string;
}

export default function ExerciseLogUpdateForm({
  logId,
  profileId,
  routes,
  initial,
}: {
  logId: string;
  profileId: string;
  routes: RouteRow[];
  initial: Initial;
}) {
  const router = useRouter();
  const [routeId, setRouteId] = useState(initial.route_id);
  const [progressHoldCountStr, setProgressHoldCountStr] = useState(
    String(initial.progress_hold_count)
  );
  const [attemptCount, setAttemptCount] = useState(initial.attempt_count);
  const [isRoundTrip, setIsRoundTrip] = useState(initial.is_round_trip);
  const [roundTripCount, setRoundTripCount] = useState(initial.round_trip_count);
  const [loggedAt, setLoggedAt] = useState(initial.logged_at);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedRoute = routes.find((r) => r.id === routeId);
  const maxHold = selectedRoute?.hold_count ?? 0;
  const progressHoldCount = Math.min(
    Math.max(0, parseInt(progressHoldCountStr, 10) || 0),
    maxHold
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("exercise_logs")
      .update({
        route_id: routeId,
        progress_hold_count: progressHoldCount,
        attempt_count: attemptCount,
        is_round_trip: isRoundTrip,
        round_trip_count: roundTripCount,
        logged_at: loggedAt,
      })
      .eq("id", logId)
      .eq("profile_id", profileId);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/exercise/" + logId);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card rounded-2xl p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">루트 *</label>
          <RouteSelect
            routes={routes}
            value={routeId}
            onChange={setRouteId}
            onSelectRoute={(r) => {
              const next = Math.min(progressHoldCount, r.hold_count);
              setProgressHoldCountStr(String(next));
            }}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">운동일 *</label>
          <input type="date" value={loggedAt} onChange={(e) => setLoggedAt(e.target.value)} required className="input-base" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">진행한 홀드수 (0 ~ {maxHold})</label>
          <input
            type="text"
            inputMode="numeric"
            value={progressHoldCountStr}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              if (v === "" || (Number(v) >= 0 && Number(v) <= maxHold)) setProgressHoldCountStr(v);
            }}
            placeholder="0"
            className="input-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">등반횟수</label>
          <input type="number" min={1} value={attemptCount} onChange={(e) => setAttemptCount(Number(e.target.value))} className="input-base" />
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
