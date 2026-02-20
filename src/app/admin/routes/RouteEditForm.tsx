"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SubmitButton } from "@/components/SubmitButton";
import {
  WALL_TYPE_LABELS,
  GRADE_VALUES,
  GRADE_DETAILS,
} from "@/types/database";
import type { WallType } from "@/types/database";

const WALL_TYPES: WallType[] = [
  "vertical",
  "slight_overhang",
  "overhang",
  "extreme_overhang",
];

type RouteInitial = {
  id: string;
  wall_type: string;
  grade_value: string;
  grade_detail: string;
  name: string;
  hold_count: number;
  rank_point: number | null;
};

export default function RouteEditForm({ route }: { route: RouteInitial }) {
  const router = useRouter();
  const [wallType, setWallType] = useState<WallType>(route.wall_type as WallType);
  const [gradeValue, setGradeValue] = useState<(typeof GRADE_VALUES)[number]>(
    route.grade_value as (typeof GRADE_VALUES)[number]
  );
  const [gradeDetail, setGradeDetail] = useState<(typeof GRADE_DETAILS)[number]>(
    route.grade_detail as (typeof GRADE_DETAILS)[number]
  );
  const [name, setName] = useState(route.name);
  const [holdCount, setHoldCount] = useState(route.hold_count);
  const [rankPoint, setRankPoint] = useState<number | "">(
    route.rank_point != null ? route.rank_point : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("루트명을 입력해 주세요.");
      return;
    }
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("routes")
      .update({
        wall_type: wallType,
        grade_value: gradeValue,
        grade_detail: gradeDetail,
        name: name.trim(),
        hold_count: holdCount,
        rank_point: rankPoint === "" ? null : rankPoint,
      })
      .eq("id", route.id);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/admin/routes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card rounded-2xl p-6">
      <h2 className="mb-4 text-lg font-semibold text-[var(--chalk)]">루트 수정</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">암벽구분</label>
          <select value={wallType} onChange={(e) => setWallType(e.target.value as WallType)} className="input-base">
            {WALL_TYPES.map((w) => (
              <option key={w} value={w}>
                {WALL_TYPE_LABELS[w]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">난이도(숫자)</label>
          <select value={gradeValue} onChange={(e) => setGradeValue(e.target.value as (typeof GRADE_VALUES)[number])} className="input-base">
            {GRADE_VALUES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">난이도(상세)</label>
          <select value={gradeDetail} onChange={(e) => setGradeDetail(e.target.value as (typeof GRADE_DETAILS)[number])} className="input-base">
            {GRADE_DETAILS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">루트명 *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-base" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">홀드수</label>
          <input type="number" min={1} value={holdCount} onChange={(e) => setHoldCount(Number(e.target.value))} className="input-base" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">랭크포인트</label>
          <input
            type="number"
            value={rankPoint === "" ? "" : rankPoint}
            onChange={(e) => {
              const v = e.target.value;
              setRankPoint(v === "" ? "" : (Number.isNaN(Number(v)) ? rankPoint : Number(v)));
            }}
            placeholder="선택"
            className="input-base"
          />
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Link
          href="/admin/routes"
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm font-medium text-[var(--chalk)] transition hover:bg-[var(--surface)]"
        >
          목록
        </Link>
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
