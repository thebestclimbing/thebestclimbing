"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

export default function RouteForm() {
  const router = useRouter();
  const [wallType, setWallType] = useState<WallType>("vertical");
  const [gradeValue, setGradeValue] = useState<(typeof GRADE_VALUES)[number]>("10");
  const [gradeDetail, setGradeDetail] = useState<(typeof GRADE_DETAILS)[number]>("a");
  const [name, setName] = useState("");
  const [holdCount, setHoldCount] = useState(10);
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
    const { error: err } = await supabase.from("routes").insert({
      wall_type: wallType,
      grade_value: gradeValue,
      grade_detail: gradeDetail,
      name: name.trim(),
      hold_count: holdCount,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
    setName("");
    setHoldCount(10);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        루트 추가
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            암벽구분
          </label>
          <select
            value={wallType}
            onChange={(e) => setWallType(e.target.value as WallType)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            {WALL_TYPES.map((w) => (
              <option key={w} value={w}>
                {WALL_TYPE_LABELS[w]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            난이도(숫자)
          </label>
          <select
            value={gradeValue}
            onChange={(e) =>
              setGradeValue(e.target.value as (typeof GRADE_VALUES)[number])
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            {GRADE_VALUES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            난이도(상세)
          </label>
          <select
            value={gradeDetail}
            onChange={(e) =>
              setGradeDetail(e.target.value as (typeof GRADE_DETAILS)[number])
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            {GRADE_DETAILS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            루트명 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            홀드수
          </label>
          <input
            type="number"
            min={1}
            value={holdCount}
            onChange={(e) => setHoldCount(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "저장 중..." : "추가"}
      </button>
    </form>
  );
}
