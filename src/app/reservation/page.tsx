"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ReservationPage() {
  const [guestName, setGuestName] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [reservedAt, setReservedAt] = useState("");
  const [reservedTime, setReservedTime] = useState("10:00");
  const [guestCount, setGuestCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!guestName.trim()) {
      setError("성명을 입력해 주세요.");
      return;
    }
    if (!depositorName.trim()) {
      setError("입금자명을 입력해 주세요.");
      return;
    }
    if (!reservedAt) {
      setError("예약일을 선택해 주세요.");
      return;
    }
    const at = new Date(reservedAt + "T" + reservedTime + ":00");
    if (isNaN(at.getTime())) {
      setError("예약일시가 올바르지 않습니다.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("daily_reservations").insert({
      guest_name: guestName.trim(),
      depositor_name: depositorName.trim(),
      reserved_at: at.toISOString(),
      guest_count: guestCount,
      status: "pending",
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccess(true);
    setGuestName("");
    setDepositorName("");
    setReservedAt("");
    setReservedTime("10:00");
    setGuestCount(1);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          일일체험 예약
        </h1>
        <p className="rounded-lg bg-green-100 p-4 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          예약이 접수되었습니다. 관리자 확인 후 예약완료 처리됩니다.
        </p>
        <p className="mt-6">
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            추가 예약
          </button>
        </p>
        <p className="mt-2">
          <Link href="/" className="text-sm text-zinc-500 hover:underline">
            메인으로
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        일일체험 예약
      </h1>
      <p className="mb-4 text-sm text-zinc-500">
        비회원 일일체험 예약입니다. 성명, 입금자명, 예약일시, 인원수를 입력해 주세요.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            성명 *
          </label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            입금자명 *
          </label>
          <input
            type="text"
            value={depositorName}
            onChange={(e) => setDepositorName(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            예약일 *
          </label>
          <input
            type="date"
            value={reservedAt}
            onChange={(e) => setReservedAt(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            예약 시간
          </label>
          <input
            type="time"
            value={reservedTime}
            onChange={(e) => setReservedTime(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            인원수 *
          </label>
          <input
            type="number"
            min={1}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "접수 중..." : "예약 접수"}
        </button>
      </form>
      <p className="mt-6">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          메인으로
        </Link>
      </p>
    </div>
  );
}
