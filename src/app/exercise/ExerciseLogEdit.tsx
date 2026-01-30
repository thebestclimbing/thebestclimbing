"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Initial {
  route_id: string;
  progress_hold_count: number;
  attempt_count: number;
  is_completed: boolean;
  is_round_trip: boolean;
  round_trip_count: number;
  logged_at: string;
}

export default function ExerciseLogEdit({
  logId,
  profileId,
  initial,
}: {
  logId: string;
  profileId: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!confirm("이 기록을 삭제할까요?")) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase
      .from("exercise_logs")
      .delete()
      .eq("id", logId)
      .eq("profile_id", profileId);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/exercise");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Link
        href={`/exercise/${logId}/edit`}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        수정
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950"
      >
        삭제
      </button>
      {error && (
        <p className="self-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
