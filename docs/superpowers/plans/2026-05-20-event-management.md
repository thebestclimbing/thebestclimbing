# 이벤트 관리 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 클라이밍 미션 이벤트(루트 완등 / 홀드 수)를 생성·관리하고, 회원은 진행 중인 이벤트와 자신의 달성 현황을 확인할 수 있는 시스템 구축

**Architecture:** Next.js 16 App Router 서버 컴포넌트 + Supabase. 진행률은 기존 `exercise_logs` 테이블을 실시간 집계 쿼리로 계산한다. 상품 지급 기록은 `event_reward_logs` 테이블에 저장한다. 폼은 클라이언트 컴포넌트(supabase client)로, 삭제·지급처리는 server action으로 구현한다.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + RLS), Tailwind CSS v4

---

## File Map

```
supabase/migrations/027_create_events.sql          — DB 마이그레이션

src/app/admin/events/page.tsx                       — 관리자 이벤트 목록
src/app/admin/events/EventDeleteButton.tsx          — 이벤트 삭제 버튼 (client)
src/app/admin/events/EventForm.tsx                  — 이벤트 생성/수정 폼 (client, 재사용)
src/app/admin/events/actions.ts                     — server actions (toggleReward)
src/app/admin/events/new/page.tsx                   — 이벤트 생성 페이지
src/app/admin/events/[id]/edit/page.tsx             — 이벤트 수정 페이지
src/app/admin/events/[id]/achievements/page.tsx     — 달성자 목록 + 상품 지급
src/app/admin/events/[id]/achievements/RewardButton.tsx — 지급 처리 버튼 (client)

src/app/events/page.tsx                             — 회원 이벤트 목록
src/app/events/[id]/page.tsx                        — 회원 이벤트 상세

src/app/admin/page.tsx                              — 이벤트관리 링크 추가 (수정)
```

---

## Task 1: DB 마이그레이션

**Files:**
- Create: `supabase/migrations/027_create_events.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- supabase/migrations/027_create_events.sql

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prize_description TEXT NOT NULL,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('route_completion', 'hold_count')),
  required_count INTEGER NOT NULL CHECK (required_count > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended')),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT events_end_after_start CHECK (end_date >= start_date)
);

CREATE TABLE public.event_routes (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, route_id)
);

CREATE TABLE public.event_reward_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rewarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reward_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "event_routes_select" ON public.event_routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "event_reward_logs_select" ON public.event_reward_logs FOR SELECT TO authenticated USING (true);
```

- [ ] **Step 2: Supabase에 마이그레이션 적용**

Supabase 대시보드 SQL Editor 또는 CLI에서 실행:
```bash
supabase db push
# 또는 SQL Editor에서 027_create_events.sql 내용 직접 실행
```

- [ ] **Step 3: 테이블 생성 확인**

Supabase 대시보드 Table Editor에서 `events`, `event_routes`, `event_reward_logs` 테이블 확인.

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/027_create_events.sql
git commit -m "feat: 이벤트 관련 테이블 마이그레이션 추가"
```

---

## Task 2: 관리자 이벤트 목록 + 삭제 버튼

**Files:**
- Create: `src/app/admin/events/page.tsx`
- Create: `src/app/admin/events/EventDeleteButton.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: 이벤트 목록 페이지 작성**

```tsx
// src/app/admin/events/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EventDeleteButton } from './EventDeleteButton'

export default async function AdminEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/events')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: events } = await supabase
    .from('events')
    .select('id, title, mission_type, start_date, end_date, status, created_at')
    .order('created_at', { ascending: false })

  const statusLabel = (s: string) =>
    s === 'active' ? '진행중' : s === 'ended' ? '종료' : '임시저장'
  const statusColor = (s: string) =>
    s === 'active' ? 'bg-emerald-500' : s === 'ended' ? 'bg-slate-500' : 'bg-yellow-500'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">이벤트 관리</h1>
      <div className="mb-4">
        <Link
          href="/admin/events/new"
          className="inline-block rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)]"
        >
          이벤트 추가
        </Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden -mx-4 sm:mx-0">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-2 font-medium text-[var(--chalk)]">제목</th>
              <th className="p-2 font-medium text-[var(--chalk)] whitespace-nowrap">미션</th>
              <th className="p-2 font-medium text-[var(--chalk)] whitespace-nowrap">기간</th>
              <th className="p-2 font-medium text-[var(--chalk)] whitespace-nowrap">상태</th>
              <th className="p-2 font-medium text-[var(--chalk)] whitespace-nowrap">액션</th>
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((e) => (
              <tr key={e.id} className="border-b border-[var(--border)]">
                <td className="p-2 font-medium text-[var(--chalk)]">{e.title}</td>
                <td className="p-2 whitespace-nowrap text-[var(--chalk-muted)]">
                  {e.mission_type === 'route_completion' ? '루트완등' : '홀드수'}
                </td>
                <td className="p-2 whitespace-nowrap text-xs text-[var(--chalk-muted)]">
                  {e.start_date} ~ {e.end_date}
                </td>
                <td className="p-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white ${statusColor(e.status)}`}>
                    {statusLabel(e.status)}
                  </span>
                </td>
                <td className="p-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/events/${e.id}/achievements`} className="text-sm text-blue-500 hover:underline">달성자</Link>
                    <Link href={`/admin/events/${e.id}/edit`} className="text-sm text-[var(--primary)] hover:underline">수정</Link>
                    <EventDeleteButton eventId={e.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(!events || events.length === 0) && (
        <p className="mt-4 text-[var(--chalk-muted)]">등록된 이벤트가 없습니다.</p>
      )}
      <p className="mt-6">
        <Link href="/admin" className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]">관리자 메뉴</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: 삭제 버튼 컴포넌트 작성**

```tsx
// src/app/admin/events/EventDeleteButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function EventDeleteButton({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('이 이벤트를 삭제하시겠습니까?')) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    setLoading(false)
    if (error) { alert(error.message); return }
    router.push('/admin/events')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {loading ? '삭제 중...' : '삭제'}
    </button>
  )
}
```

- [ ] **Step 3: 관리자 메인 페이지에 이벤트관리 링크 추가**

`src/app/admin/page.tsx`의 `<ul>` 끝에 추가:

```tsx
// 기존 <li> 목록 마지막에 추가
<li>
  <Link href="/admin/events" className="text-blue-600 hover:underline">
    이벤트관리
  </Link>
</li>
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | grep -v node_modules | head -20
```

Expected: `✓ Compiled successfully`

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/events/page.tsx src/app/admin/events/EventDeleteButton.tsx src/app/admin/page.tsx
git commit -m "feat: 관리자 이벤트 목록 페이지 추가"
```

---

## Task 3: 이벤트 폼 + 생성 페이지

**Files:**
- Create: `src/app/admin/events/EventForm.tsx`
- Create: `src/app/admin/events/new/page.tsx`

- [ ] **Step 1: 이벤트 폼 컴포넌트 작성**

```tsx
// src/app/admin/events/EventForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Route = { id: string; name: string; wall_type: string; grade_value: string }

type EventInitial = {
  id: string
  title: string
  description: string
  prize_description: string
  mission_type: 'route_completion' | 'hold_count'
  required_count: number
  start_date: string
  end_date: string
  status: 'draft' | 'active' | 'ended'
  selectedRouteIds: string[]
}

export function EventForm({ routes, event }: { routes: Route[]; event?: EventInitial }) {
  const router = useRouter()
  const isEdit = Boolean(event?.id)
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [prizeDescription, setPrizeDescription] = useState(event?.prize_description ?? '')
  const [missionType, setMissionType] = useState<'route_completion' | 'hold_count'>(event?.mission_type ?? 'route_completion')
  const [requiredCount, setRequiredCount] = useState(event?.required_count ?? 1)
  const [startDate, setStartDate] = useState(event?.start_date ?? '')
  const [endDate, setEndDate] = useState(event?.end_date ?? '')
  const [status, setStatus] = useState<'draft' | 'active' | 'ended'>(event?.status ?? 'draft')
  const [selectedRoutes, setSelectedRoutes] = useState<Set<string>>(new Set(event?.selectedRouteIds ?? []))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleRoute = (routeId: string) => {
    setSelectedRoutes((prev) => {
      const next = new Set(prev)
      next.has(routeId) ? next.delete(routeId) : next.add(routeId)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (missionType === 'route_completion' && selectedRoutes.size === 0) {
      setError('완등할 루트를 1개 이상 선택해주세요.')
      return
    }
    if (endDate < startDate) {
      setError('종료일은 시작일 이후여야 합니다.')
      return
    }
    setLoading(true)
    const supabase = createClient()

    const payload = {
      title: title.trim(),
      description: description.trim(),
      prize_description: prizeDescription.trim(),
      mission_type: missionType,
      required_count: requiredCount,
      start_date: startDate,
      end_date: endDate,
      status,
    }

    if (isEdit) {
      const { error: err } = await supabase.from('events').update(payload).eq('id', event!.id)
      if (err) { setError(err.message); setLoading(false); return }

      if (missionType === 'route_completion') {
        await supabase.from('event_routes').delete().eq('event_id', event!.id)
        const rows = Array.from(selectedRoutes).map((route_id) => ({ event_id: event!.id, route_id }))
        if (rows.length > 0) {
          const { error: routeErr } = await supabase.from('event_routes').insert(rows)
          if (routeErr) { setError(routeErr.message); setLoading(false); return }
        }
      }
    } else {
      const { data: newEvent, error: err } = await supabase.from('events').insert(payload).select('id').single()
      if (err || !newEvent) { setError(err?.message ?? '오류 발생'); setLoading(false); return }

      if (missionType === 'route_completion' && selectedRoutes.size > 0) {
        const rows = Array.from(selectedRoutes).map((route_id) => ({ event_id: newEvent.id, route_id }))
        const { error: routeErr } = await supabase.from('event_routes').insert(rows)
        if (routeErr) { setError(routeErr.message); setLoading(false); return }
      }
    }

    setLoading(false)
    router.push('/admin/events')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="card rounded-2xl p-6">
      <div className="grid gap-4">
        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">제목 *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--chalk)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">설명 *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--chalk)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">상품 설명 *</label>
          <input
            value={prizeDescription}
            onChange={(e) => setPrizeDescription(e.target.value)}
            required
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--chalk)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-[var(--chalk-muted)]">시작일 *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--chalk)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--chalk-muted)]">종료일 *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--chalk)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-[var(--chalk-muted)]">상태</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'active' | 'ended')}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--chalk)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="draft">임시저장</option>
            <option value="active">진행중</option>
            <option value="ended">종료</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-[var(--chalk-muted)]">미션 타입 *</label>
          <div className="flex gap-6">
            {(['route_completion', 'hold_count'] as const).map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  value={type}
                  checked={missionType === type}
                  onChange={() => setMissionType(type)}
                />
                <span className="text-sm text-[var(--chalk)]">
                  {type === 'route_completion' ? '지정 루트 완등' : '홀드 수 달성'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {missionType === 'route_completion' && (
          <div>
            <div className="mb-2 flex items-center gap-3">
              <label className="text-sm text-[var(--chalk-muted)]">달성 기준 개수</label>
              <input
                type="number"
                min={1}
                value={requiredCount}
                onChange={(e) => setRequiredCount(Number(e.target.value))}
                className="w-20 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-sm text-[var(--chalk)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-[var(--chalk-muted)]">개 이상 완등 시 달성</span>
            </div>
            <label className="mb-1 block text-sm text-[var(--chalk-muted)]">완등 루트 선택 ({selectedRoutes.size}개 선택됨)</label>
            <div className="max-h-60 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              {routes.map((route) => (
                <label key={route.id} className="flex cursor-pointer items-center gap-2 py-1 hover:text-[var(--chalk)]">
                  <input
                    type="checkbox"
                    checked={selectedRoutes.has(route.id)}
                    onChange={() => toggleRoute(route.id)}
                  />
                  <span className="text-sm text-[var(--chalk)]">
                    {route.name} <span className="text-[var(--chalk-muted)]">({route.wall_type} / {route.grade_value})</span>
                  </span>
                </label>
              ))}
              {routes.length === 0 && <p className="text-sm text-[var(--chalk-muted)]">등록된 루트가 없습니다.</p>}
            </div>
          </div>
        )}

        {missionType === 'hold_count' && (
          <div>
            <label className="mb-1 block text-sm text-[var(--chalk-muted)]">목표 완등 횟수 *</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={requiredCount}
                onChange={(e) => setRequiredCount(Number(e.target.value))}
                className="w-28 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--chalk)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-[var(--chalk-muted)]">회 이상 완등 시 달성</span>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
        >
          {loading ? '저장 중...' : isEdit ? '수정하기' : '이벤트 추가'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: 이벤트 생성 페이지 작성**

```tsx
// src/app/admin/events/new/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EventForm } from '../EventForm'

export default async function AdminEventNewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/events/new')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: routes } = await supabase
    .from('routes')
    .select('id, name, wall_type, grade_value')
    .order('wall_type')
    .order('grade_value')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">이벤트 추가</h1>
      <EventForm routes={routes ?? []} />
      <p className="mt-6">
        <Link href="/admin/events" className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]">목록으로</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | grep -v node_modules | head -20
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4: 커밋**

```bash
git add src/app/admin/events/EventForm.tsx src/app/admin/events/new/page.tsx
git commit -m "feat: 이벤트 생성 폼 및 페이지 추가"
```

---

## Task 4: 이벤트 수정 페이지

**Files:**
- Create: `src/app/admin/events/[id]/edit/page.tsx`

- [ ] **Step 1: 이벤트 수정 페이지 작성**

```tsx
// src/app/admin/events/[id]/edit/page.tsx
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EventForm } from '../../EventForm'

export default async function AdminEventEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/admin/events/${id}/edit`)

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const [{ data: event }, { data: routes }, { data: eventRoutes }] = await Promise.all([
    supabase.from('events')
      .select('id, title, description, prize_description, mission_type, required_count, start_date, end_date, status')
      .eq('id', id).single(),
    supabase.from('routes').select('id, name, wall_type, grade_value').order('wall_type').order('grade_value'),
    supabase.from('event_routes').select('route_id').eq('event_id', id),
  ])

  if (!event) notFound()

  const initial = {
    ...event,
    mission_type: event.mission_type as 'route_completion' | 'hold_count',
    status: event.status as 'draft' | 'active' | 'ended',
    selectedRouteIds: (eventRoutes ?? []).map((r) => r.route_id),
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">이벤트 수정</h1>
      <EventForm routes={routes ?? []} event={initial} />
      <p className="mt-6">
        <Link href="/admin/events" className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]">목록으로</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | grep -v node_modules | head -20
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/events/[id]/edit/page.tsx
git commit -m "feat: 이벤트 수정 페이지 추가"
```

---

## Task 5: 달성자 목록 + 상품 지급

**Files:**
- Create: `src/app/admin/events/actions.ts`
- Create: `src/app/admin/events/[id]/achievements/page.tsx`
- Create: `src/app/admin/events/[id]/achievements/RewardButton.tsx`

- [ ] **Step 1: server action 작성 (지급 처리)**

```ts
// src/app/admin/events/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function toggleReward(eventId: string, userId: string, isCurrentlyRewarded: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'unauthorized' }

  const admin = createAdminClient()
  if (isCurrentlyRewarded) {
    await admin.from('event_reward_logs').delete().eq('event_id', eventId).eq('user_id', userId)
  } else {
    await admin.from('event_reward_logs').upsert({ event_id: eventId, user_id: userId })
  }

  revalidatePath(`/admin/events/${eventId}/achievements`)
  return { error: null }
}
```

- [ ] **Step 2: 달성자 목록 페이지 작성**

진행률 계산 헬퍼 함수:
- `route_completion`: event_routes의 route_id 목록과 exercise_logs를 조인해 user별 완등한 고유 루트 수를 집계
- `hold_count`: 기간 내 exercise_logs의 is_completed=true 건수를 user별 집계
- 날짜 범위: `logged_at >= start_date` AND `logged_at <= end_date + 'T23:59:59'`

```tsx
// src/app/admin/events/[id]/achievements/page.tsx
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RewardButton } from './RewardButton'

export default async function AchievementsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/admin/events/${id}/achievements`)

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: event } = await supabase
    .from('events')
    .select('id, title, mission_type, required_count, start_date, end_date')
    .eq('id', id)
    .single()

  if (!event) notFound()

  // progress map: userId → achieved count
  const progressMap: Record<string, number> = {}

  if (event.mission_type === 'route_completion') {
    const { data: eventRoutes } = await supabase
      .from('event_routes')
      .select('route_id')
      .eq('event_id', id)
    const routeIds = (eventRoutes ?? []).map((r) => r.route_id)

    if (routeIds.length > 0) {
      const { data: logs } = await supabase
        .from('exercise_logs')
        .select('profile_id, route_id')
        .in('route_id', routeIds)
        .eq('is_completed', true)
        .gte('logged_at', event.start_date)
        .lte('logged_at', `${event.end_date}T23:59:59`)

      const setMap: Record<string, Set<string>> = {}
      for (const log of logs ?? []) {
        if (!setMap[log.profile_id]) setMap[log.profile_id] = new Set()
        setMap[log.profile_id].add(log.route_id)
      }
      for (const [uid, set] of Object.entries(setMap)) {
        progressMap[uid] = set.size
      }
    }
  } else {
    const { data: logs } = await supabase
      .from('exercise_logs')
      .select('profile_id')
      .eq('is_completed', true)
      .gte('logged_at', event.start_date)
      .lte('logged_at', `${event.end_date}T23:59:59`)

    for (const log of logs ?? []) {
      progressMap[log.profile_id] = (progressMap[log.profile_id] || 0) + 1
    }
  }

  const achieverIds = Object.entries(progressMap)
    .filter(([, count]) => count >= event.required_count)
    .map(([uid]) => uid)

  const [{ data: members }, { data: rewardLogs }] = await Promise.all([
    achieverIds.length > 0
      ? supabase.from('profiles').select('id, name').in('id', achieverIds)
      : { data: [] },
    supabase.from('event_reward_logs').select('user_id').eq('event_id', id),
  ])

  const rewardedSet = new Set((rewardLogs ?? []).map((r) => r.user_id))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--chalk)]">{event.title}</h1>
      <p className="mb-6 text-sm text-[var(--chalk-muted)]">
        달성 기준: {event.required_count}{event.mission_type === 'route_completion' ? '개 루트 완등' : '회 완등'} · {event.start_date} ~ {event.end_date}
      </p>

      <h2 className="mb-4 text-lg font-semibold text-[var(--chalk)]">
        달성자 목록 <span className="text-sm font-normal text-[var(--chalk-muted)]">({achieverIds.length}명)</span>
      </h2>

      {achieverIds.length === 0 ? (
        <p className="text-[var(--chalk-muted)]">아직 달성한 회원이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden -mx-4 sm:mx-0">
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="p-2 font-medium text-[var(--chalk)]">회원명</th>
                <th className="p-2 font-medium text-[var(--chalk)] whitespace-nowrap">달성 수</th>
                <th className="p-2 font-medium text-[var(--chalk)] whitespace-nowrap">상품 지급</th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((member) => (
                <tr key={member.id} className="border-b border-[var(--border)]">
                  <td className="p-2 font-medium text-[var(--chalk)]">{member.name}</td>
                  <td className="p-2 text-[var(--chalk-muted)]">
                    {progressMap[member.id]} / {event.required_count}
                  </td>
                  <td className="p-2">
                    <RewardButton
                      eventId={id}
                      userId={member.id}
                      isRewarded={rewardedSet.has(member.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6">
        <Link href="/admin/events" className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]">이벤트 목록</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 3: 지급 처리 버튼 컴포넌트 작성**

```tsx
// src/app/admin/events/[id]/achievements/RewardButton.tsx
'use client'

import { useState } from 'react'
import { toggleReward } from '../../../actions'

export function RewardButton({
  eventId,
  userId,
  isRewarded,
}: {
  eventId: string
  userId: string
  isRewarded: boolean
}) {
  const [rewarded, setRewarded] = useState(isRewarded)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    const result = await toggleReward(eventId, userId, rewarded)
    setLoading(false)
    if (result.error) { alert(result.error); return }
    setRewarded((prev) => !prev)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-lg px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
        rewarded
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'border border-[var(--border)] text-[var(--chalk-muted)] hover:bg-[var(--surface-muted)]'
      }`}
    >
      {loading ? '...' : rewarded ? '✓ 지급완료' : '지급처리'}
    </button>
  )
}
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | grep -v node_modules | head -20
```

Expected: `✓ Compiled successfully`

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/events/actions.ts src/app/admin/events/[id]/achievements/page.tsx src/app/admin/events/[id]/achievements/RewardButton.tsx
git commit -m "feat: 이벤트 달성자 목록 및 상품 지급 처리 추가"
```

---

## Task 6: 회원 이벤트 목록 페이지

**Files:**
- Create: `src/app/events/page.tsx`

- [ ] **Step 1: 회원 이벤트 목록 페이지 작성**

진행률 계산은 active 이벤트별로 개인화된 값을 보여준다. 이벤트 수가 적으므로 루프 내 쿼리도 허용 범위.

```tsx
// src/app/events/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type EventRow = {
  id: string
  title: string
  prize_description: string
  mission_type: string
  required_count: number
  start_date: string
  end_date: string
}

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/events')

  const { data: events } = await supabase
    .from('events')
    .select('id, title, prize_description, mission_type, required_count, start_date, end_date')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // 각 이벤트별 개인 진행률 계산
  const progressList = await Promise.all(
    (events ?? []).map(async (event: EventRow) => {
      let achieved = 0
      if (event.mission_type === 'route_completion') {
        const { data: eventRoutes } = await supabase
          .from('event_routes')
          .select('route_id')
          .eq('event_id', event.id)
        const routeIds = (eventRoutes ?? []).map((r: { route_id: string }) => r.route_id)
        if (routeIds.length > 0) {
          const { data: logs } = await supabase
            .from('exercise_logs')
            .select('route_id')
            .eq('profile_id', user.id)
            .in('route_id', routeIds)
            .eq('is_completed', true)
            .gte('logged_at', event.start_date)
            .lte('logged_at', `${event.end_date}T23:59:59`)
          const unique = new Set((logs ?? []).map((l: { route_id: string }) => l.route_id))
          achieved = unique.size
        }
      } else {
        const { count } = await supabase
          .from('exercise_logs')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', user.id)
          .eq('is_completed', true)
          .gte('logged_at', event.start_date)
          .lte('logged_at', `${event.end_date}T23:59:59`)
        achieved = count ?? 0
      }
      return { eventId: event.id, achieved }
    })
  )

  const progressMap = Object.fromEntries(progressList.map((p) => [p.eventId, p.achieved]))

  // 상품 수령 여부
  const { data: rewardLogs } = await supabase
    .from('event_reward_logs')
    .select('event_id')
    .eq('user_id', user.id)
  const rewardedSet = new Set((rewardLogs ?? []).map((r: { event_id: string }) => r.event_id))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">이벤트</h1>
      {(!events || events.length === 0) ? (
        <p className="text-[var(--chalk-muted)]">진행 중인 이벤트가 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(events as EventRow[]).map((event) => {
            const achieved = progressMap[event.id] ?? 0
            const percent = Math.min(100, Math.round((achieved / event.required_count) * 100))
            const isDone = achieved >= event.required_count
            const isRewarded = rewardedSet.has(event.id)
            return (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--primary)]">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-[var(--chalk)]">{event.title}</h2>
                    {isRewarded ? (
                      <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-xs text-white">수령완료</span>
                    ) : isDone ? (
                      <span className="shrink-0 rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-white">달성!</span>
                    ) : null}
                  </div>
                  <p className="mb-3 text-sm text-[var(--chalk-muted)]">🎁 {event.prize_description}</p>
                  <p className="mb-2 text-xs text-[var(--chalk-muted)]">{event.start_date} ~ {event.end_date}</p>
                  <div className="mb-1 flex items-center justify-between text-xs text-[var(--chalk-muted)]">
                    <span>{event.mission_type === 'route_completion' ? '루트 완등' : '완등 횟수'}</span>
                    <span className={isDone ? 'font-semibold text-emerald-500' : ''}>{achieved} / {event.required_count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                    <div
                      className={`h-full rounded-full transition-all ${isDone ? 'bg-emerald-500' : 'bg-[var(--primary)]'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | grep -v node_modules | head -20
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: 커밋**

```bash
git add src/app/events/page.tsx
git commit -m "feat: 회원 이벤트 목록 페이지 추가"
```

---

## Task 7: 회원 이벤트 상세 페이지

**Files:**
- Create: `src/app/events/[id]/page.tsx`

- [ ] **Step 1: 이벤트 상세 페이지 작성**

```tsx
// src/app/events/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/events/${id}`)

  const { data: event } = await supabase
    .from('events')
    .select('id, title, description, prize_description, mission_type, required_count, start_date, end_date, status')
    .eq('id', id)
    .single()

  if (!event) notFound()

  let achieved = 0
  type RouteDetail = { route_id: string; routes: { id: string; name: string; wall_type: string; grade_value: string } | null }
  let eventRouteDetails: RouteDetail[] = []
  let completedRouteIds = new Set<string>()

  if (event.mission_type === 'route_completion') {
    const { data: eventRoutes } = await supabase
      .from('event_routes')
      .select('route_id, routes(id, name, wall_type, grade_value)')
      .eq('event_id', id)
    eventRouteDetails = (eventRoutes ?? []) as RouteDetail[]
    const routeIds = eventRouteDetails.map((r) => r.route_id)

    if (routeIds.length > 0) {
      const { data: logs } = await supabase
        .from('exercise_logs')
        .select('route_id')
        .eq('profile_id', user.id)
        .in('route_id', routeIds)
        .eq('is_completed', true)
        .gte('logged_at', event.start_date)
        .lte('logged_at', `${event.end_date}T23:59:59`)
      completedRouteIds = new Set((logs ?? []).map((l: { route_id: string }) => l.route_id))
      achieved = completedRouteIds.size
    }
  } else {
    const { count } = await supabase
      .from('exercise_logs')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('is_completed', true)
      .gte('logged_at', event.start_date)
      .lte('logged_at', `${event.end_date}T23:59:59`)
    achieved = count ?? 0
  }

  const isDone = achieved >= event.required_count
  const percent = Math.min(100, Math.round((achieved / event.required_count) * 100))

  const { data: rewardLog } = await supabase
    .from('event_reward_logs')
    .select('id, rewarded_at')
    .eq('event_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--chalk)]">{event.title}</h1>
      <p className="mb-1 text-sm text-[var(--chalk-muted)]">{event.start_date} ~ {event.end_date}</p>
      <p className="mb-6 text-sm text-[var(--chalk-muted)]">
        상태: {event.status === 'active' ? '진행중' : event.status === 'ended' ? '종료' : '준비중'}
      </p>

      <div className="card mb-6 rounded-2xl p-5">
        <p className="mb-1 text-sm font-medium text-[var(--chalk-muted)]">이벤트 설명</p>
        <p className="whitespace-pre-wrap text-[var(--chalk)]">{event.description}</p>
      </div>

      <div className="card mb-6 rounded-2xl p-5">
        <p className="mb-1 text-sm font-medium text-[var(--chalk-muted)]">🎁 상품</p>
        <p className="font-semibold text-[var(--chalk)]">{event.prize_description}</p>
        {rewardLog && (
          <p className="mt-2 text-sm text-emerald-500">✓ 상품 수령 완료 ({rewardLog.rewarded_at.slice(0, 10)})</p>
        )}
      </div>

      <div className="card rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--chalk-muted)]">
            {event.mission_type === 'route_completion' ? '루트 완등 현황' : '완등 횟수 현황'}
          </p>
          <span className={`text-sm font-semibold ${isDone ? 'text-emerald-500' : 'text-[var(--chalk)]'}`}>
            {achieved} / {event.required_count}
            {isDone && ' 달성!'}
          </span>
        </div>
        <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <div
            className={`h-full rounded-full transition-all ${isDone ? 'bg-emerald-500' : 'bg-[var(--primary)]'}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {event.mission_type === 'route_completion' && eventRouteDetails.length > 0 && (
          <ul className="space-y-2">
            {eventRouteDetails.map((er) => {
              const done = completedRouteIds.has(er.route_id)
              const route = er.routes
              return (
                <li key={er.route_id} className="flex items-center gap-3">
                  <span className={`text-lg ${done ? 'text-emerald-500' : 'text-[var(--chalk-muted)]'}`}>
                    {done ? '✓' : '○'}
                  </span>
                  <span className={`text-sm ${done ? 'text-[var(--chalk)]' : 'text-[var(--chalk-muted)]'}`}>
                    {route?.name ?? '알 수 없는 루트'} {route && `(${route.wall_type} / ${route.grade_value})`}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="mt-6">
        <Link href="/events" className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]">이벤트 목록</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | grep -v node_modules | head -20
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: 커밋**

```bash
git add src/app/events/[id]/page.tsx
git commit -m "feat: 회원 이벤트 상세 페이지 추가"
```

---

## Self-Review Checklist

### Spec coverage

| 요구사항 | 구현 태스크 |
|---|---|
| events 테이블 + event_routes + event_reward_logs | Task 1 |
| 관리자 이벤트 목록 (상태 배지, 달성자 링크) | Task 2 |
| 이벤트 생성 폼 (미션타입 분기, 루트 다중선택) | Task 3 |
| 이벤트 수정 페이지 | Task 4 |
| 달성자 목록 + 상품 지급 처리 | Task 5 |
| 회원 이벤트 목록 + 진행률 바 | Task 6 |
| 회원 이벤트 상세 (루트별 완등여부, 진행률) | Task 7 |
| route_completion 진행률 집계 | Task 5, 6, 7 |
| hold_count 진행률 집계 | Task 5, 6, 7 |
| 상품 수령 완료 표시 | Task 6, 7 |
| 관리자 메뉴 링크 추가 | Task 2 |
