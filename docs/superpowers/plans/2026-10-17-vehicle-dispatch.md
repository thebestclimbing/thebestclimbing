# 차량 배차 관리 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 등반공지에서 회원이 등록한 차량 정보를 바탕으로 관리자가 공지별 차량·탑승자를 배정하고, 일반 사용자는 공지 상세 페이지에서 배차 현황을 조회할 수 있게 한다.

**Architecture:** 신규 테이블 3개(`member_vehicles`, `notice_dispatches`, `dispatch_passengers`)를 추가하고, `NoticeWriteForm`에 배차 관리 UI(`DispatchManager`)를 통합해 신규 작성·수정 양쪽에서 동일하게 동작시킨다. 수정 시 저장은 "기존 배차 전체 삭제 후 현재 상태로 재삽입"하는 단순한 전체 교체(replace) 방식을 쓴다 — diff 로직보다 코드가 단순하고 결과는 동일하다.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + RLS), TypeScript, Tailwind CSS v4

**참고:** 이 프로젝트에는 자동화된 테스트 프레임워크(jest/vitest)가 없다. 각 작업의 검증은 `npx tsc --noEmit`(타입 체크), `npm run lint`, 그리고 브라우저/SQL을 통한 수동 확인으로 진행한다 — 기존 PR들의 검증 방식과 동일하다.

Spec: `docs/superpowers/specs/2026-10-17-vehicle-dispatch-design.md`

---

### Task 1: `member_vehicles` 테이블 마이그레이션

**Files:**
- Create: `supabase/migrations/035_create_member_vehicles.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 회원 차량 정보 (1인당 1대)
CREATE TABLE public.member_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  seat_count INT NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER member_vehicles_updated_at BEFORE UPDATE ON public.member_vehicles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.member_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "차량 정보 공개 조회" ON public.member_vehicles
  FOR SELECT USING (true);

CREATE POLICY "차량 정보 본인 관리" ON public.member_vehicles
  FOR ALL USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
```

- [ ] **Step 2: Supabase MCP로 마이그레이션 적용**

`mcp__plugin_supabase_supabase__apply_migration` 도구를 `project_id: "cigmptfowvvnygdbxlvp"`, `name: "create_member_vehicles"`, `query`에 Step 1의 SQL 전체로 호출한다.

- [ ] **Step 3: 적용 확인**

`mcp__plugin_supabase_supabase__list_tables`(project_id: "cigmptfowvvnygdbxlvp")로 `member_vehicles` 테이블이 생겼는지 확인한다. 또는 `mcp__plugin_supabase_supabase__execute_sql`로 아래 쿼리 실행:

```sql
insert into member_vehicles (profile_id, model, seat_count) values ((select id from profiles limit 1), '테스트카', 4);
select * from member_vehicles;
delete from member_vehicles where model = '테스트카';
```
Expected: insert/select/delete 모두 에러 없이 성공.

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/035_create_member_vehicles.sql
git commit -m "feat: member_vehicles 테이블 추가 (회원 차량 정보, 1인당 1대)"
```

---

### Task 2: `notice_dispatches` / `dispatch_passengers` 테이블 마이그레이션

**Files:**
- Create: `supabase/migrations/036_create_notice_dispatches.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 공지에 배정된 차량
CREATE TABLE public.notice_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.member_vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notice_id, vehicle_id)
);

-- 차량별 탑승자
CREATE TABLE public.dispatch_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NOT NULL REFERENCES public.notice_dispatches(id) ON DELETE CASCADE,
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notice_id, profile_id)
);

ALTER TABLE public.notice_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "배차 공개 조회" ON public.notice_dispatches
  FOR SELECT USING (true);

CREATE POLICY "배차 관리자" ON public.notice_dispatches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "탑승자 공개 조회" ON public.dispatch_passengers
  FOR SELECT USING (true);

CREATE POLICY "탑승자 관리자" ON public.dispatch_passengers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

- [ ] **Step 2: Supabase MCP로 마이그레이션 적용**

`mcp__plugin_supabase_supabase__apply_migration` 호출, `project_id: "cigmptfowvvnygdbxlvp"`, `name: "create_notice_dispatches"`, `query`에 Step 1 SQL 전체.

- [ ] **Step 3: 적용 확인**

`mcp__plugin_supabase_supabase__execute_sql`(project_id: "cigmptfowvvnygdbxlvp")로:

```sql
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('notice_dispatches', 'dispatch_passengers');
```
Expected: 두 행 모두 반환.

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/036_create_notice_dispatches.sql
git commit -m "feat: notice_dispatches, dispatch_passengers 테이블 추가"
```

---

### Task 3: `src/types/database.ts`에 타입 추가

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: 인터페이스 추가**

`export interface NoticeComment` 선언부 바로 아래에 추가:

```typescript
export interface MemberVehicle {
  id: string;
  profile_id: string;
  model: string;
  seat_count: number;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoticeDispatch {
  id: string;
  notice_id: string;
  vehicle_id: string;
  created_at: string;
}

export interface DispatchPassenger {
  id: string;
  dispatch_id: string;
  notice_id: string;
  profile_id: string;
  created_at: string;
}
```

- [ ] **Step 2: `Database.Tables`에 매핑 추가**

`notice_comments: { ... }` 줄 바로 아래에 추가:

```typescript
      member_vehicles: { Row: MemberVehicle; Insert: Omit<MemberVehicle, "id" | "created_at" | "updated_at">; Update: Partial<MemberVehicle> };
      notice_dispatches: { Row: NoticeDispatch; Insert: Omit<NoticeDispatch, "id" | "created_at">; Update: Partial<NoticeDispatch> };
      dispatch_passengers: { Row: DispatchPassenger; Insert: Omit<DispatchPassenger, "id" | "created_at">; Update: Partial<DispatchPassenger> };
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add src/types/database.ts
git commit -m "feat: 차량/배차 타입 정의 추가"
```

---

### Task 4: `MemberVehicleForm` 컴포넌트 + `/member` 페이지 통합

**Files:**
- Create: `src/app/member/MemberVehicleForm.tsx`
- Modify: `src/app/member/page.tsx`

- [ ] **Step 1: `MemberVehicleForm.tsx` 작성**

```tsx
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
```

- [ ] **Step 2: `src/app/member/page.tsx`에 차량 정보 조회 + 섹션 추가**

`profile` 조회 바로 아래, `completedLogs` 조회 이전에 추가:

```typescript
  const { data: vehicle } = await supabase
    .from("member_vehicles")
    .select("model, seat_count, memo")
    .eq("profile_id", user.id)
    .maybeSingle();
```

`</div>` (랭크 카드를 감싸는 `<div className="card rounded-2xl p-6">...</div>`) 바로 다음, `<div className="mt-4 flex flex-wrap items-center gap-4">` 이전에 추가:

```tsx
      <MemberVehicleForm
        key={vehicle ? "registered" : "new"}
        profileId={user.id}
        initial={vehicle ?? null}
      />
```

파일 상단 import 목록에 추가:

```typescript
import { MemberVehicleForm } from "./MemberVehicleForm";
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```
Expected: 에러 없음.

- [ ] **Step 4: 수동 확인**

`npm run dev` 실행 후 로그인 상태로 `/member` 접속 → "내 차량 정보" 카드에서 모델명/좌석수 입력 후 등록 → 새로고침 시 값이 유지되는지 확인 → 삭제 버튼 클릭 후 폼이 빈 등록 폼으로 돌아오는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/app/member/MemberVehicleForm.tsx src/app/member/page.tsx
git commit -m "feat: 회원 차량 정보 등록/수정/삭제 기능 추가"
```

---

### Task 5: `DispatchManager` 컴포넌트 작성

**Files:**
- Create: `src/app/admin/notices/DispatchManager.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
"use client";

export interface DispatchVehicleOption {
  id: string;
  model: string;
  seatCount: number;
  ownerName: string;
}

export interface DispatchMemberOption {
  id: string;
  name: string;
}

export interface DispatchEntry {
  vehicleId: string;
  passengerIds: string[];
}

export function DispatchManager({
  availableVehicles,
  availableMembers,
  dispatches,
  onChange,
}: {
  availableVehicles: DispatchVehicleOption[];
  availableMembers: DispatchMemberOption[];
  dispatches: DispatchEntry[];
  onChange: (next: DispatchEntry[]) => void;
}) {
  const usedVehicleIds = new Set(dispatches.map((d) => d.vehicleId));
  const selectableVehicles = availableVehicles.filter((v) => !usedVehicleIds.has(v.id));
  const assignedMemberIds = new Set(dispatches.flatMap((d) => d.passengerIds));

  function addVehicle(vehicleId: string) {
    if (!vehicleId) return;
    onChange([...dispatches, { vehicleId, passengerIds: [] }]);
  }

  function removeVehicle(vehicleId: string) {
    onChange(dispatches.filter((d) => d.vehicleId !== vehicleId));
  }

  function addPassenger(vehicleId: string, profileId: string) {
    if (!profileId) return;
    onChange(
      dispatches.map((d) =>
        d.vehicleId === vehicleId ? { ...d, passengerIds: [...d.passengerIds, profileId] } : d
      )
    );
  }

  function removePassenger(vehicleId: string, profileId: string) {
    onChange(
      dispatches.map((d) =>
        d.vehicleId === vehicleId
          ? { ...d, passengerIds: d.passengerIds.filter((id) => id !== profileId) }
          : d
      )
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-[var(--border)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--chalk)]">배차 관리</h3>
        <select
          value=""
          onChange={(e) => addVehicle(e.target.value)}
          className="input-base w-auto text-sm"
        >
          <option value="">+ 차량 추가</option>
          {selectableVehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.ownerName} — {v.model} ({v.seatCount}인승)
            </option>
          ))}
        </select>
      </div>

      {dispatches.length === 0 && (
        <p className="text-sm text-[var(--chalk-muted)]">추가된 차량이 없습니다.</p>
      )}

      <div className="grid gap-3">
        {dispatches.map((entry) => {
          const vehicle = availableVehicles.find((v) => v.id === entry.vehicleId);
          if (!vehicle) return null;
          const isOverCapacity = entry.passengerIds.length > vehicle.seatCount;
          const selectableMembers = availableMembers.filter(
            (m) => !assignedMemberIds.has(m.id)
          );
          return (
            <div key={entry.vehicleId} className="rounded-lg bg-[var(--surface-muted)] p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--chalk)]">
                  {vehicle.ownerName} — {vehicle.model} ({entry.passengerIds.length}/{vehicle.seatCount}인승)
                </span>
                <button
                  type="button"
                  onClick={() => removeVehicle(entry.vehicleId)}
                  className="text-xs text-red-600 hover:underline"
                >
                  차량 제거
                </button>
              </div>
              {isOverCapacity && (
                <p className="mt-1 text-xs text-amber-500">
                  탑승 인원이 좌석수({vehicle.seatCount}석)를 초과했습니다.
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {entry.passengerIds.map((pid) => {
                  const member = availableMembers.find((m) => m.id === pid);
                  return (
                    <span
                      key={pid}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-muted)] px-2.5 py-1 text-xs text-[var(--chalk)]"
                    >
                      {member?.name ?? "알수없음"}
                      <button
                        type="button"
                        onClick={() => removePassenger(entry.vehicleId, pid)}
                        className="text-[var(--chalk-muted)] hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
              <select
                value=""
                onChange={(e) => addPassenger(entry.vehicleId, e.target.value)}
                className="input-base mt-2 w-auto text-sm"
              >
                <option value="">+ 탑승자 추가</option>
                {selectableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```
Expected: 에러 없음 (아직 아무 곳에서도 import하지 않으므로 미사용 export 경고만 있을 수 있음 — 무시).

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/notices/DispatchManager.tsx
git commit -m "feat: 배차 관리 UI 컴포넌트(DispatchManager) 추가"
```

---

### Task 6: `NoticeWriteForm`에 배차 저장 로직 통합

**Files:**
- Modify: `src/app/admin/notices/NoticeWriteForm.tsx`

- [ ] **Step 1: 전체 파일을 아래 내용으로 교체**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SubmitButton } from "@/components/SubmitButton";
import {
  DispatchManager,
  type DispatchEntry,
  type DispatchVehicleOption,
  type DispatchMemberOption,
} from "./DispatchManager";

type NoticeInitial = {
  id: string;
  title: string;
  body: string;
  popup_yn?: "Y" | "N";
  notice_type?: "센터공지" | "등반공지";
};

export function NoticeWriteForm({
  authorId,
  notice,
  vehicles = [],
  members = [],
  initialDispatches = [],
}: {
  authorId: string;
  notice?: NoticeInitial;
  vehicles?: DispatchVehicleOption[];
  members?: DispatchMemberOption[];
  initialDispatches?: DispatchEntry[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(notice?.title ?? "");
  const [body, setBody] = useState(notice?.body ?? "");
  const [popupYn, setPopupYn] = useState<"Y" | "N">(notice?.popup_yn ?? "N");
  const [noticeType, setNoticeType] = useState<"센터공지" | "등반공지">(
    notice?.notice_type ?? "센터공지"
  );
  const [dispatches, setDispatches] = useState<DispatchEntry[]>(initialDispatches);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(notice?.id);

  async function saveDispatches(
    supabase: ReturnType<typeof createClient>,
    noticeId: string
  ): Promise<string | null> {
    const validVehicleIds = new Set(vehicles.map((v) => v.id));
    for (const d of dispatches) {
      if (!validVehicleIds.has(d.vehicleId)) continue;
      const { data: dispatchRow, error: dispatchErr } = await supabase
        .from("notice_dispatches")
        .insert({ notice_id: noticeId, vehicle_id: d.vehicleId })
        .select("id")
        .single();
      if (dispatchErr || !dispatchRow) return dispatchErr?.message ?? "배차 등록 실패";
      if (d.passengerIds.length > 0) {
        const { error: passErr } = await supabase.from("dispatch_passengers").insert(
          d.passengerIds.map((profileId) => ({
            dispatch_id: dispatchRow.id,
            notice_id: noticeId,
            profile_id: profileId,
          }))
        );
        if (passErr) return passErr.message;
      }
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();

    if (isEdit) {
      const { error: err } = await supabase
        .from("notices")
        .update({
          title: title.trim(),
          body: body.trim() || "",
          popup_yn: popupYn,
          notice_type: noticeType,
        })
        .eq("id", notice!.id);
      if (err) {
        setLoading(false);
        setError(err.message);
        return;
      }
      const { error: delErr } = await supabase
        .from("notice_dispatches")
        .delete()
        .eq("notice_id", notice!.id);
      if (delErr) {
        setLoading(false);
        setError(delErr.message);
        return;
      }
      if (noticeType === "등반공지") {
        const dispatchErrMsg = await saveDispatches(supabase, notice!.id);
        if (dispatchErrMsg) {
          setLoading(false);
          setError(dispatchErrMsg);
          return;
        }
      }
    } else {
      const { data: inserted, error: err } = await supabase
        .from("notices")
        .insert({
          author_id: authorId,
          title: title.trim(),
          body: body.trim() || "",
          popup_yn: popupYn,
          notice_type: noticeType,
        })
        .select("id")
        .single();
      if (err || !inserted) {
        setLoading(false);
        setError(err?.message ?? "등록 실패");
        return;
      }
      if (noticeType === "등반공지") {
        const dispatchErrMsg = await saveDispatches(supabase, inserted.id);
        if (dispatchErrMsg) {
          setLoading(false);
          setError(dispatchErrMsg);
          return;
        }
      }
    }
    setLoading(false);
    router.push("/admin/notices");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card rounded-2xl p-6">
      <div className="grid gap-4">
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">
            공지 타입 *
          </label>
          <div className="flex gap-4">
            {(["센터공지", "등반공지"] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="notice_type"
                  value={type}
                  checked={noticeType === type}
                  onChange={() => setNoticeType(type)}
                  className="accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--chalk)]">{type}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="title" className="mb-1 block text-sm text-[var(--chalk-muted)]">
            제목 *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="input-base"
          />
        </div>
        <div>
          <label htmlFor="body" className="mb-1 block text-sm text-[var(--chalk-muted)]">
            내용
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="input-base min-h-[120px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="popup_yn"
            checked={popupYn === "Y"}
            onChange={(e) => setPopupYn(e.target.checked ? "Y" : "N")}
            className="rounded border-[var(--border)]"
          />
          <label htmlFor="popup_yn" className="text-sm text-[var(--chalk)]">
            팝업여부 Y (최초 사이트 진입 시 팝업으로 표시)
          </label>
        </div>
        {noticeType === "등반공지" && (
          <DispatchManager
            availableVehicles={vehicles}
            availableMembers={members}
            dispatches={dispatches}
            onChange={setDispatches}
          />
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4">
        <SubmitButton
          loading={loading}
          loadingLabel={isEdit ? "수정 중..." : "저장 중..."}
          className="btn-primary disabled:pointer-events-none"
        >
          {isEdit ? "수정" : "저장"}
        </SubmitButton>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```
Expected: 에러 없음.

- [ ] **Step 3: 수동 확인**

`npm run dev` → `/admin/notices/new`에서 공지타입을 "등반공지"로 선택 → "배차 관리" 섹션이 나타나는지 확인 (차량/회원 목록은 Task 7 전까지 비어있는 게 정상). "센터공지" 선택 시 섹션이 숨겨지는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/app/admin/notices/NoticeWriteForm.tsx
git commit -m "feat: 공지 작성/수정 폼에 배차 관리 섹션 및 저장 로직 통합"
```

---

### Task 7: admin 신규/수정 페이지 — 차량·회원·기존배차 데이터 연결

**Files:**
- Modify: `src/app/admin/notices/new/page.tsx`
- Modify: `src/app/admin/notices/[id]/edit/page.tsx`

- [ ] **Step 1: `new/page.tsx` 전체를 아래 내용으로 교체**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NoticeWriteForm } from "../NoticeWriteForm";
import type { DispatchVehicleOption, DispatchMemberOption } from "../DispatchManager";

export default async function AdminNoticeNewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/notices/new");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") redirect("/");

  const { data: vehicleRows } = await supabase
    .from("member_vehicles")
    .select("id, model, seat_count, owner:profiles(name)");
  const vehicles: DispatchVehicleOption[] = (vehicleRows ?? []).map((v) => {
    const row = v as unknown as {
      id: string;
      model: string;
      seat_count: number;
      owner: { name: string } | { name: string }[] | null;
    };
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
    return { id: row.id, model: row.model, seatCount: row.seat_count, ownerName: owner?.name ?? "" };
  });

  const { data: memberRows } = await supabase.from("profiles").select("id, name").order("name");
  const members: DispatchMemberOption[] = (memberRows ?? []).map((m) => ({ id: m.id, name: m.name }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">공지 추가</h1>
      <NoticeWriteForm authorId={user.id} vehicles={vehicles} members={members} />
      <p className="mt-6">
        <Link
          href="/admin/notices"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          목록으로
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: `[id]/edit/page.tsx` 전체를 아래 내용으로 교체**

```tsx
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NoticeWriteForm } from "../../NoticeWriteForm";
import type { DispatchVehicleOption, DispatchMemberOption, DispatchEntry } from "../../DispatchManager";

export default async function AdminNoticeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/notices/" + id + "/edit");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") redirect("/");

  const { data: notice, error } = await supabase
    .from("notices")
    .select("id, title, body, popup_yn, notice_type")
    .eq("id", id)
    .single();

  if (error || !notice) notFound();

  const { data: vehicleRows } = await supabase
    .from("member_vehicles")
    .select("id, model, seat_count, owner:profiles(name)");
  const vehicles: DispatchVehicleOption[] = (vehicleRows ?? []).map((v) => {
    const row = v as unknown as {
      id: string;
      model: string;
      seat_count: number;
      owner: { name: string } | { name: string }[] | null;
    };
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
    return { id: row.id, model: row.model, seatCount: row.seat_count, ownerName: owner?.name ?? "" };
  });

  const { data: memberRows } = await supabase.from("profiles").select("id, name").order("name");
  const members: DispatchMemberOption[] = (memberRows ?? []).map((m) => ({ id: m.id, name: m.name }));

  const { data: dispatchRows } = await supabase
    .from("notice_dispatches")
    .select("vehicle_id, passengers:dispatch_passengers(profile_id)")
    .eq("notice_id", id);
  const initialDispatches: DispatchEntry[] = (dispatchRows ?? []).map((d) => {
    const row = d as unknown as { vehicle_id: string; passengers: { profile_id: string }[] | null };
    return { vehicleId: row.vehicle_id, passengerIds: (row.passengers ?? []).map((p) => p.profile_id) };
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">공지 수정</h1>
      <NoticeWriteForm
        authorId={user.id}
        notice={notice}
        vehicles={vehicles}
        members={members}
        initialDispatches={initialDispatches}
      />
      <p className="mt-6">
        <Link
          href="/admin/notices"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          목록으로
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```
Expected: 에러 없음.

- [ ] **Step 4: 수동 확인 (End-to-End)**

1. `/member`에서 두 명의 테스트 계정으로 각각 차량을 등록해둔다 (Task 4에서 이미 확인했다면 재사용 가능).
2. `/admin/notices/new`에서 공지타입 "등반공지" 선택 → 배차 관리에서 차량 추가 → 탑승자 2명 추가 (좌석수보다 많이 추가해 경고 문구 노출 확인) → 저장.
3. 생성된 공지를 `/admin/notices/[id]/edit`에서 다시 열어 방금 추가한 차량·탑승자가 그대로 로드되는지 확인.
4. 차량을 하나 제거하고 다시 저장 → 다시 열었을 때 제거한 차량이 사라졌는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/notices/new/page.tsx "src/app/admin/notices/[id]/edit/page.tsx"
git commit -m "feat: 공지 작성/수정 화면에 등록된 차량·회원·기존 배차 데이터 연결"
```

---

### Task 8: 공지 상세 페이지 — 배차 현황 표시

**Files:**
- Create: `src/app/notice/[id]/DispatchDisplay.tsx`
- Modify: `src/app/notice/[id]/page.tsx`

- [ ] **Step 1: `DispatchDisplay.tsx` 작성**

```tsx
interface DispatchDisplayEntry {
  vehicleModel: string;
  ownerName: string;
  passengerNames: string[];
}

export function DispatchDisplay({ dispatches }: { dispatches: DispatchDisplayEntry[] }) {
  if (dispatches.length === 0) return null;

  return (
    <section className="card mt-6 rounded-2xl p-6">
      <h2 className="mb-4 text-lg font-bold text-[var(--chalk)]">배차 현황</h2>
      <div className="grid gap-3">
        {dispatches.map((d, i) => (
          <div key={i} className="rounded-lg bg-[var(--surface-muted)] p-3">
            <p className="text-sm font-medium text-[var(--chalk)]">
              {d.ownerName} — {d.vehicleModel}
            </p>
            <p className="mt-1 text-sm text-[var(--chalk-muted)]">
              탑승자: {d.passengerNames.length > 0 ? d.passengerNames.join(", ") : "-"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `page.tsx` 전체를 아래 내용으로 교체**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeKST } from "@/lib/date";
import { NoticeCommentSection } from "./NoticeCommentSection";
import { DispatchDisplay } from "./DispatchDisplay";

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: notice, error } = await supabase
    .from("notices")
    .select(
      `
      id,
      title,
      body,
      notice_type,
      created_at,
      author:profiles(id, name)
    `
    )
    .eq("id", id)
    .single();

  if (error || !notice) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: comments } = await supabase
    .from("notice_comments")
    .select(
      `
      id,
      body,
      created_at,
      author:profiles(id, name)
    `
    )
    .eq("notice_id", id)
    .order("created_at", { ascending: true });

  const row = notice as unknown as {
    id: string;
    title: string;
    body: string;
    notice_type: "센터공지" | "등반공지";
    created_at: string;
    author: { id: string; name: string } | { id: string; name: string }[] | null;
  };
  const author = Array.isArray(row.author) ? row.author[0] : row.author;

  type CommentRow = {
    id: string;
    body: string;
    created_at: string;
    author: { id: string; name: string } | { id: string; name: string }[] | null;
  };
  const commentList = (comments ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    author: (c as unknown as CommentRow).author,
  }));

  let dispatchDisplayList: { vehicleModel: string; ownerName: string; passengerNames: string[] }[] = [];
  if (row.notice_type === "등반공지") {
    const { data: dispatchRows } = await supabase
      .from("notice_dispatches")
      .select(
        `
        id,
        vehicle:member_vehicles(model, owner:profiles(name)),
        passengers:dispatch_passengers(profile:profiles(name))
      `
      )
      .eq("notice_id", id);

    type DispatchRow = {
      id: string;
      vehicle:
        | { model: string; owner: { name: string } | { name: string }[] | null }
        | { model: string; owner: { name: string } | { name: string }[] | null }[]
        | null;
      passengers: { profile: { name: string } | { name: string }[] | null }[] | null;
    };
    dispatchDisplayList = (dispatchRows ?? []).map((d) => {
      const r = d as unknown as DispatchRow;
      const vehicle = Array.isArray(r.vehicle) ? r.vehicle[0] : r.vehicle;
      const owner = vehicle ? (Array.isArray(vehicle.owner) ? vehicle.owner[0] : vehicle.owner) : null;
      const passengerNames = (r.passengers ?? [])
        .map((p) => {
          const profile = Array.isArray(p.profile) ? p.profile[0] : p.profile;
          return profile?.name ?? "";
        })
        .filter(Boolean);
      return {
        vehicleModel: vehicle?.model ?? "",
        ownerName: owner?.name ?? "",
        passengerNames,
      };
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <article className="card rounded-2xl p-6">
        <h1 className="mb-4 text-2xl font-bold text-[var(--chalk)]">
          {row.title}
        </h1>
        <div className="mb-4 flex gap-4 text-sm text-[var(--chalk-muted)]">
          <span>작성자: {author?.name ?? "-"}</span>
          <span>작성일자: {formatDateTimeKST(row.created_at)}</span>
        </div>
        <div className="whitespace-pre-wrap text-[var(--chalk)]">
          {row.body || "(내용 없음)"}
        </div>
      </article>

      {row.notice_type === "등반공지" && <DispatchDisplay dispatches={dispatchDisplayList} />}

      <NoticeCommentSection
        noticeId={id}
        initialComments={commentList}
        isLoggedIn={!!user}
      />

      <p className="mt-6">
        <Link
          href="/notice"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          목록으로
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```
Expected: 에러 없음.

- [ ] **Step 4: 수동 확인**

Task 7에서 배차를 구성해둔 등반공지 상세 페이지(`/notice/[id]`)에 로그아웃 상태로 접속 → "배차 현황" 섹션에 차량·소유자·탑승자가 보이는지 확인. 배차가 없는 등반공지/센터공지에서는 섹션이 보이지 않는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add "src/app/notice/[id]/DispatchDisplay.tsx" "src/app/notice/[id]/page.tsx"
git commit -m "feat: 공지 상세 페이지에 배차 현황 표시"
```

---

### Task 9: 최종 검증

**Files:** 없음 (전체 검증)

- [ ] **Step 1: 린트**

```bash
npm run lint
```
Expected: 에러 없음 (기존 무관 warning은 허용).

- [ ] **Step 2: 빌드**

```bash
npm run build
```
Expected: 빌드 성공.

- [ ] **Step 3: RLS 점검**

`mcp__plugin_supabase_supabase__get_advisors`(project_id: "cigmptfowvvnygdbxlvp", type: "security")로 `member_vehicles`, `notice_dispatches`, `dispatch_passengers`에 대한 보안 경고가 없는지 확인.

- [ ] **Step 4: 전체 플로우 수동 재확인**

Task 4, 7, 8의 수동 확인을 한 번에 이어서 실행 — 회원 차량 등록 → 신규 공지에서 즉시 배차 구성 후 저장 → 상세 페이지에서 비로그인으로 조회 → 수정 화면에서 배차 변경 → 상세 페이지 반영 확인.

---

## Out of Scope (spec 기준)

- 차량번호(번호판) 입력
- 회원 본인이 직접 탑승 신청/취소
- 비등록 차량으로 즉석 배차
- 좌석 초과 시 저장 차단 (경고만 표시)
