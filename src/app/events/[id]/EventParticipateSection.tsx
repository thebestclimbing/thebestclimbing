'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WALL_TYPE_LABELS } from '@/types/database'

type RouteInfo = {
  route_id: string
  target_count: number
  routes: { id: string; name: string; wall_type: string; grade_value: string; grade_detail: string } | null
}

export function EventParticipateSection({
  eventId,
  userId,
  missionType,
  eventRoutes,
  participatingRouteIds,
  isParticipatingHold,
  eventStatus,
  fullRouteIds,
}: {
  eventId: string
  userId: string
  missionType: 'route_completion' | 'hold_count'
  eventRoutes: RouteInfo[]
  participatingRouteIds: string[]
  isParticipatingHold: boolean
  eventStatus: string
  fullRouteIds: string[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (eventStatus !== 'active') return null

  const toggleRoute = (routeId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(routeId)) { next.delete(routeId) } else { next.add(routeId) }
      return next
    })
  }

  async function handleJoin() {
    setError('')
    setLoading(true)
    const supabase = createClient()

    if (missionType === 'hold_count') {
      const { error: err } = await supabase.from('event_participants').insert({
        event_id: eventId,
        user_id: userId,
        route_id: null,
      })
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      if (selected.size === 0) { setError('참여할 루트를 1개 이상 선택해주세요.'); setLoading(false); return }
      const rows = Array.from(selected).map((route_id) => ({ event_id: eventId, user_id: userId, route_id }))
      const { error: err } = await supabase.from('event_participants').insert(rows)
      if (err) { setError(err.message); setLoading(false); return }
    }

    setLoading(false)
    router.refresh()
  }

  if (missionType === 'hold_count') {
    return (
      <div className="card mb-6 rounded-2xl p-5">
        <p className="mb-3 text-sm font-medium text-[var(--chalk-muted)]">이벤트 참여</p>
        {isParticipatingHold ? (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-500">참여중</span>
            <span className="text-sm text-[var(--chalk-muted)]">이벤트 기간 내 완등 홀드 수가 자동으로 집계됩니다.</span>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm text-[var(--chalk-muted)]">이벤트에 참여하면 기간 내 완등 홀드 수가 집계됩니다.</p>
            <button
              onClick={handleJoin}
              disabled={loading}
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {loading ? '처리 중...' : '이벤트 참여하기'}
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    )
  }

  // route_completion
  const notJoinedRoutes = eventRoutes.filter((er) => !participatingRouteIds.includes(er.route_id))
  const joinableRoutes = notJoinedRoutes.filter((er) => !fullRouteIds.includes(er.route_id))
  const closedRoutes = notJoinedRoutes.filter((er) => fullRouteIds.includes(er.route_id))
  const allJoined = joinableRoutes.length === 0

  return (
    <div className="card mb-6 rounded-2xl p-5">
      <p className="mb-3 text-sm font-medium text-[var(--chalk-muted)]">이벤트 참여</p>

      {/* 이미 참여중인 루트 */}
      {participatingRouteIds.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-xs text-[var(--chalk-muted)]">참여중인 루트</p>
          <div className="flex flex-wrap gap-2">
            {eventRoutes
              .filter((er) => participatingRouteIds.includes(er.route_id))
              .map((er) => (
                <span key={er.route_id} className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
                  ✓ {er.routes?.name ?? er.route_id}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* 달성 마감된 루트 (참여 불가) */}
      {closedRoutes.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-xs text-[var(--chalk-muted)]">마감된 루트</p>
          <div className="space-y-1.5">
            {closedRoutes.map((er) => {
              const route = er.routes
              return (
                <div key={er.route_id} className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 opacity-50">
                  <span className="text-sm text-[var(--chalk-muted)]">
                    {route?.name ?? er.route_id}
                    {route && (
                      <span className="ml-1 text-xs">
                        ({WALL_TYPE_LABELS[route.wall_type as keyof typeof WALL_TYPE_LABELS] ?? route.wall_type} / {route.grade_value}{route.grade_detail})
                      </span>
                    )}
                  </span>
                  <span className="ml-auto rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-white">달성마감</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 추가 참여 가능한 루트 */}
      {!allJoined && (
        <div>
          <p className="mb-2 text-xs text-[var(--chalk-muted)]">
            {participatingRouteIds.length > 0 ? '추가로 참여할 루트' : '참여할 루트를 선택하세요'}
          </p>
          <div className="mb-3 space-y-1.5">
            {joinableRoutes.map((er) => {
              const route = er.routes
              return (
                <label key={er.route_id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 transition hover:bg-[var(--surface-muted)]">
                  <input
                    type="checkbox"
                    checked={selected.has(er.route_id)}
                    onChange={() => toggleRoute(er.route_id)}
                  />
                  <span className="text-sm text-[var(--chalk)]">
                    {route?.name ?? er.route_id}
                    {route && (
                      <span className="ml-1 text-xs text-[var(--chalk-muted)]">
                        ({WALL_TYPE_LABELS[route.wall_type as keyof typeof WALL_TYPE_LABELS] ?? route.wall_type} / {route.grade_value}{route.grade_detail})
                      </span>
                    )}
                  </span>
                </label>
              )
            })}
          </div>
          <button
            onClick={handleJoin}
            disabled={loading || selected.size === 0}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
          >
            {loading ? '처리 중...' : `선택한 루트 참여 (${selected.size}개)`}
          </button>
        </div>
      )}

      {allJoined && (
        <p className="text-sm text-[var(--chalk-muted)]">
          {notJoinedRoutes.length === 0 ? '이벤트의 모든 루트에 참여하고 있습니다.' : '참여 가능한 루트가 없습니다.'}
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}
