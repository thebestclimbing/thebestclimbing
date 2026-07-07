"use client";

import React, { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import ExerciseLogAddSection from "./ExerciseLogAddSection";
import ExerciseLogList from "./ExerciseLogList";
import type { GradeDetail, GradeValue } from "@/types/database";

interface RouteRow {
  id: string;
  wall_type: string;
  grade_value: string;
  grade_detail: string;
  name: string;
  hold_count: number;
}

interface LogItem {
  id: string;
  progress_hold_count: number;
  attempt_count: number;
  is_completed: boolean;
  completion_requested: boolean;
  is_round_trip: boolean;
  round_trip_count: number;
  logged_at: string;
  memo: string | null;
  route: {
    id: string;
    wall_type: string;
    grade_value: GradeValue;
    grade_detail: GradeDetail;
    name: string;
    hold_count: number;
  };
}

export interface LogInsertPayload {
  route: RouteRow;
  progress_hold_count: number;
  attempt_count: number;
  is_round_trip: boolean;
  round_trip_count: number;
  logged_at: string;
}

export default function ExerciseLogSection({
  profileId,
  routes,
  completedRouteIds,
  eventRouteIds,
  logs,
  completedRouteIdToDate,
  children,
}: {
  profileId: string;
  routes: RouteRow[];
  completedRouteIds: string[];
  eventRouteIds: string[];
  logs: LogItem[];
  completedRouteIdToDate: Record<string, string>;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [optimisticLogs, addOptimisticLog] = useOptimistic(
    logs,
    (state: LogItem[], newLog: LogItem) => [newLog, ...state]
  );

  function handleInsert(payload: LogInsertPayload) {
    const optimisticLog: LogItem = {
      id: `optimistic-${Date.now()}`,
      progress_hold_count: payload.progress_hold_count,
      attempt_count: payload.attempt_count,
      is_completed: false,
      completion_requested: false,
      is_round_trip: payload.is_round_trip,
      round_trip_count: payload.round_trip_count,
      logged_at: payload.logged_at,
      memo: null,
      route: {
        id: payload.route.id,
        wall_type: payload.route.wall_type,
        grade_value: payload.route.grade_value as GradeValue,
        grade_detail: payload.route.grade_detail as GradeDetail,
        name: payload.route.name,
        hold_count: payload.route.hold_count,
      },
    };
    startTransition(() => {
      addOptimisticLog(optimisticLog);
      router.refresh();
    });
  }

  return (
    <>
      <ExerciseLogAddSection
        profileId={profileId}
        routes={routes}
        completedRouteIds={completedRouteIds}
        eventRouteIds={eventRouteIds}
        onInsert={handleInsert}
      />
      {children}
      <section className="mt-8 lg:mt-10">
        <h2 className="mb-4 text-lg font-semibold text-[var(--chalk)] md:text-xl lg:text-2xl">
          기록 목록
        </h2>
        <ExerciseLogList
          logs={optimisticLogs}
          profileId={profileId}
          completedRouteIdToDate={completedRouteIdToDate}
        />
      </section>
    </>
  );
}
