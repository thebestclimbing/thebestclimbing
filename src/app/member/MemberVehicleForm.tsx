"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SubmitButton } from "@/components/SubmitButton";

interface Initial {
  model: string;
  seat_count: number;
  memo: string | null;
}

export function MemberVehicleForm({
  profileId,
  initial,
}: {
  profileId: string;
  initial: Initial | null;
}) {
  const router = useRouter();
  const [model, setModel] = useState(initial?.model ?? "");
  const [seatCountStr, setSeatCountStr] = useState(
    initial ? String(initial.seat_count) : ""
  );
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isRegistered = Boolean(initial);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const seatCount = parseInt(seatCountStr, 10);
    if (!model.trim() || !seatCount || seatCount < 1) {
      setError("차종/모델명과 좌석수를 올바르게 입력해주세요.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("member_vehicles").upsert(
      {
        profile_id: profileId,
        model: model.trim(),
        seat_count: seatCount,
        memo: memo.trim() || null,
      },
      { onConflict: "profile_id" }
    );
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("등록한 차량 정보를 삭제하시겠습니까?")) return;
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("member_vehicles")
      .delete()
      .eq("profile_id", profileId);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="card mt-6 rounded-2xl p-6">
      <h2 className="mb-4 text-lg font-bold text-[var(--chalk)]">내 차량 정보</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">차종/모델명 *</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
            className="input-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">좌석수 *</label>
          <input
            type="text"
            inputMode="numeric"
            value={seatCountStr}
            onChange={(e) => setSeatCountStr(e.target.value.replace(/\D/g, ""))}
            required
            className="input-base"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">메모</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="input-base"
          />
        </div>
        {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
        <div className="sm:col-span-2 flex items-center gap-4">
          <SubmitButton loading={loading} loadingLabel="저장 중..." className="btn-primary disabled:pointer-events-none">
            {isRegistered ? "수정" : "등록"}
          </SubmitButton>
          {isRegistered && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              삭제
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
