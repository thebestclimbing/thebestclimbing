'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WALL_TYPE_LABELS } from '@/types/database'

type Route = { id: string; name: string; wall_type: string; grade_value: string; grade_detail: string }

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
  selectedRoutes: { route_id: string; target_count: number }[]
}

export function EventForm({ routes, event, busyRouteIds = [] }: { routes: Route[]; event?: EventInitial; busyRouteIds?: string[] }) {
  const router = useRouter()
  const isEdit = Boolean(event?.id)
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [prizeDescription, setPrizeDescription] = useState(event?.prize_description ?? '')
  const [missionType, setMissionType] = useState<'route_completion' | 'hold_count'>(event?.mission_type ?? 'route_completion')
  const [requiredCount, setRequiredCount] = useState(event?.required_count ?? 1)
  const [startDate, setStartDate] = useState(event?.start_date ?? new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(event?.end_date ?? '')
  const [status, setStatus] = useState<'draft' | 'active' | 'ended'>(event?.status ?? 'draft')
  const [selectedRoutes, setSelectedRoutes] = useState<Map<string, number>>(
    new Map((event?.selectedRoutes ?? []).map(({ route_id, target_count }) => [route_id, target_count]))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleRoute = (routeId: string) => {
    setSelectedRoutes((prev) => {
      const next = new Map(prev)
      if (next.has(routeId)) { next.delete(routeId) } else { next.set(routeId, 0) }
      return next
    })
  }

  const setRouteCount = (routeId: string, count: number) => {
    setSelectedRoutes((prev) => new Map(prev).set(routeId, count))
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
        const rows = Array.from(selectedRoutes.entries()).map(([route_id, target_count]) => ({ event_id: event!.id, route_id, target_count }))
        if (rows.length > 0) {
          const { error: routeErr } = await supabase.from('event_routes').insert(rows)
          if (routeErr) { setError(routeErr.message); setLoading(false); return }
        }
      }
    } else {
      const { data: newEvent, error: err } = await supabase.from('events').insert(payload).select('id').single()
      if (err || !newEvent) { setError(err?.message ?? '오류 발생'); setLoading(false); return }

      if (missionType === 'route_completion' && selectedRoutes.size > 0) {
        const rows = Array.from(selectedRoutes.entries()).map(([route_id, target_count]) => ({ event_id: newEvent.id, route_id, target_count }))
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
            <div className="mb-2 hidden items-center gap-3">
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
            <div className="grid gap-3 sm:grid-cols-3">
              {(['10', '11', '12'] as const).map((grade) => {
                const gradeRoutes = routes
                  .filter((r) => r.grade_value === grade)
                  .sort((a, b) => a.grade_detail.localeCompare(b.grade_detail))
                return (
                  <div key={grade} className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                    <p className="mb-2 text-xs font-semibold text-[var(--chalk-muted)]">{grade}급</p>
                    {gradeRoutes.length === 0 && <p className="text-xs text-[var(--chalk-muted)]">루트 없음</p>}
                    {gradeRoutes.map((route) => {
                      const isBusy = busyRouteIds.includes(route.id) && !selectedRoutes.has(route.id)
                      return (
                        <div key={route.id} className="py-1">
                          <label className={`flex items-center gap-2 ${isBusy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                            <input
                              type="checkbox"
                              checked={selectedRoutes.has(route.id)}
                              onChange={() => !isBusy && toggleRoute(route.id)}
                              disabled={isBusy}
                            />
                            <span className="text-sm text-[var(--chalk)]">
                              {route.name}
                              <span className="ml-1 text-[var(--chalk-muted)]">
                                ({WALL_TYPE_LABELS[route.wall_type as keyof typeof WALL_TYPE_LABELS] ?? route.wall_type} / {route.grade_value}{route.grade_detail})
                              </span>
                              {isBusy && (
                                <span className="ml-1.5 rounded bg-orange-500/10 px-1 py-0.5 text-xs font-medium text-orange-500">진행중</span>
                              )}
                            </span>
                          </label>
                          {selectedRoutes.has(route.id) && (
                            <div className="ml-5 mt-1 flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                value={selectedRoutes.get(route.id) || ''}
                                onChange={(e) => setRouteCount(route.id, Number(e.target.value) || 0)}
                                className="w-16 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--chalk)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                              />
                              <span className="text-xs text-[var(--chalk-muted)]">명</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {missionType === 'hold_count' && (
          <div>
            <label className="mb-1 block text-sm text-[var(--chalk-muted)]">미션 완등 홀 수 *</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={requiredCount || ''}
                onChange={(e) => setRequiredCount(Number(e.target.value) || 0)}
                className="w-28 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--chalk)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-[var(--chalk-muted)]">개</span>
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
