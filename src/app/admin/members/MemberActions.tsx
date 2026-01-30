"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

type ProfileRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  phone_tail4: string;
  membership_start: string | null;
  membership_end: string | null;
  membership_paused?: boolean;
  role: string;
  created_at: string;
};

function addMonths(isoDate: string | null, months: number): string {
  const d = isoDate ? new Date(isoDate + "T12:00:00") : new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function MemberActions({ profile }: { profile: ProfileRow }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"extend1" | "extend3" | "pause" | "resume" | null>(null);
  const [error, setError] = useState("");

  async function extendMembership(months: 1 | 3) {
    setError("");
    setLoading(months === 1 ? "extend1" : "extend3");
    const supabase = createClient();
    const newEnd = addMonths(profile.membership_end, months);
    const updates: { membership_end: string; membership_start?: string } = { membership_end: newEnd };
    if (!profile.membership_start) {
      updates.membership_start = new Date().toISOString().slice(0, 10);
    }
    const { error: err } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);
    setLoading(null);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  async function setPaused(paused: boolean) {
    setError("");
    setLoading(paused ? "pause" : "resume");
    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({ membership_paused: paused })
      .eq("id", profile.id);
    setLoading(null);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  const isPaused = profile.membership_paused === true;

  return (
    <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => extendMembership(1)}
          disabled={!!loading}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--chalk)] transition hover:bg-[var(--surface-muted)] disabled:opacity-50"
        >
          {loading === "extend1" ? <LoadingSpinner size="sm" /> : "1개월 연장"}
        </button>
        <button
          type="button"
          onClick={() => extendMembership(3)}
          disabled={!!loading}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--chalk)] transition hover:bg-[var(--surface-muted)] disabled:opacity-50"
        >
          {loading === "extend3" ? <LoadingSpinner size="sm" /> : "3개월 연장"}
        </button>
        {isPaused ? (
          <button
            type="button"
            onClick={() => setPaused(false)}
            disabled={!!loading}
            className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            {loading === "resume" ? <LoadingSpinner size="sm" className="text-white" /> : "회원권 시작"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPaused(true)}
            disabled={!!loading}
            className="rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {loading === "pause" ? <LoadingSpinner size="sm" className="text-white" /> : "회원권 정지"}
          </button>
        )}
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
