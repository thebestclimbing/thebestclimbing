"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { getMemberExerciseData, type MemberExerciseData } from "./actions";
import ExerciseMonthStats from "../ExerciseMonthStats";
import ExerciseLogList from "../ExerciseLogList";
import { LoadingSpinner } from "@/components/LoadingSpinner";

type Profile = { id: string; name: string };

export function MemberExerciseView({ profiles }: { profiles: Profile[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<MemberExerciseData | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => p.name.toLowerCase().includes(q));
  }, [profiles, inputValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function selectMember(profile: Profile) {
    setSelectedId(profile.id);
    setInputValue(profile.name);
    setIsOpen(false);
    setLoading(true);
    setData(null);
    try {
      const result = await getMemberExerciseData(profile.id);
      setData(result);
    } finally {
      setLoading(false);
    }
  }

  function clearSelection() {
    setSelectedId("");
    setInputValue("");
    setData(null);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:max-w-5xl lg:px-6 lg:py-10 xl:max-w-6xl xl:px-8 xl:py-12">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">회원 운동일지</h1>
      <p className="mb-4 text-sm text-[var(--chalk-muted)]">
        조회할 회원을 선택하면 아래에 해당 회원의 운동일지가 표시됩니다.
      </p>

      <div className="mb-6 max-w-sm" ref={containerRef}>
        <label htmlFor="member-combobox" className="mb-2 block text-sm font-medium text-[var(--chalk-muted)]">
          조회할 회원
        </label>
        <div className="relative">
          <input
            id="member-combobox"
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="이름을 입력하거나 선택하세요"
            className="input-base w-full pr-8"
            autoComplete="off"
          />
          {selectedId && (
            <button
              type="button"
              onClick={clearSelection}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--chalk-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--chalk)]"
              aria-label="선택 해제"
            >
              <span aria-hidden>×</span>
            </button>
          )}
          {isOpen && filtered.length > 0 && (
            <ul
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
              role="listbox"
            >
              {filtered.map((p) => (
                <li
                  key={p.id}
                  role="option"
                  onClick={() => selectMember(p)}
                  className="cursor-pointer px-4 py-2 text-[var(--chalk)] hover:bg-[var(--surface-muted)]"
                >
                  {p.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {!loading && data?.ok === true && (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-[var(--chalk)]">
              회원: <strong>{data.profile.name}</strong>
            </span>
          </div>

          <section className="mt-8 lg:mt-10">
            <ExerciseMonthStats
              totalHolds={data.totalHolds}
              averageHolds={data.averageHolds}
              maxDailyHolds={data.maxDailyHolds}
              routeCount={data.routeCount}
              attendanceCount={data.attendanceCount}
              weekSummaries={data.weekSummaries}
            />
          </section>
          <section className="mt-8 lg:mt-10">
            <h2 className="mb-4 text-lg font-semibold text-[var(--chalk)] md:text-xl lg:text-2xl">
              기록 목록
            </h2>
            <ExerciseLogList
              logs={data.logs}
              profileId={data.profile.id}
              completedRouteIdToDate={data.completedRouteIdToDate}
              readOnly
            />
          </section>
        </>
      )}

      {!loading && data?.ok === false && data.error === "not_found" && selectedId && (
        <p className="text-sm text-[var(--chalk-muted)]">해당 회원을 찾을 수 없습니다.</p>
      )}

      <p className="mt-6">
        <Link href="/exercise" className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]">
          나의 운동일지
        </Link>
      </p>
    </div>
  );
}
