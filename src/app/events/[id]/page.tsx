import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { WALL_TYPE_LABELS } from '@/types/database'
import { EventParticipateSection } from './EventParticipateSection'

type RouteDetail = {
  route_id: string
  target_count: number
  routes: { id: string; name: string; wall_type: string; grade_value: string; grade_detail: string } | null
}

type LogRow = { profile_id: string; route_id: string }
type HoldParticipantDetail = { userId: string; name: string; achieved: number; isDone: boolean }

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/events/${id}`)

  const [
    { data: event },
    { data: myParticipations },
  ] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, description, prize_description, mission_type, required_count, start_date, end_date, status')
      .eq('id', id)
      .single(),
    supabase
      .from('event_participants')
      .select('route_id')
      .eq('event_id', id)
      .eq('user_id', user.id),
  ])

  if (!event) notFound()

  const participatingRouteIds = (myParticipations ?? [])
    .filter((p: { route_id: string | null }) => p.route_id !== null)
    .map((p: { route_id: string | null }) => p.route_id as string)
  const isParticipatingHold = (myParticipations ?? []).some((p: { route_id: string | null }) => p.route_id === null)

  let personalAchieved = 0
  let totalAchieved = 0
  let totalTarget = 0
  let eventRouteDetails: RouteDetail[] = []
  let completedRouteIds = new Set<string>()
  const routeCompletersMap = new Map<string, number>()
  const routeCompleterNamesMap = new Map<string, string[]>()
  const routeParticipantsMap = new Map<string, number>()
  const routeParticipantNamesMap = new Map<string, string[]>()
  let holdParticipantDetails: HoldParticipantDetail[] = []

  if (event.mission_type === 'route_completion') {
    const { data: eventRoutes } = await supabase
      .from('event_routes')
      .select('route_id, target_count, routes(id, name, wall_type, grade_value, grade_detail)')
      .eq('event_id', id)
    eventRouteDetails = (eventRoutes ?? []) as unknown as RouteDetail[]
    totalTarget = eventRouteDetails.reduce((sum, r) => sum + (r.target_count ?? 0), 0)
    const routeIds = eventRouteDetails.map((r) => r.route_id)

    // 루트별 참여 인원 집계
    const { data: participantRows } = await supabase
      .from('event_participants')
      .select('route_id, profiles(name)')
      .eq('event_id', id)
      .not('route_id', 'is', null)
    type ParticipantRow = { route_id: string; profiles: { name: string } | null }
    for (const p of (participantRows ?? []) as unknown as ParticipantRow[]) {
      routeParticipantsMap.set(p.route_id, (routeParticipantsMap.get(p.route_id) ?? 0) + 1)
      if (p.profiles?.name) {
        if (!routeParticipantNamesMap.has(p.route_id)) routeParticipantNamesMap.set(p.route_id, [])
        routeParticipantNamesMap.get(p.route_id)!.push(p.profiles.name)
      }
    }

    if (routeIds.length > 0) {
      const { data: allLogs } = await supabase
        .from('exercise_logs')
        .select('profile_id, route_id')
        .in('route_id', routeIds)
        .eq('is_completed', true)
        .gte('logged_at', event.start_date)
        .lte('logged_at', `${event.end_date}T23:59:59`)
      const logRows = (allLogs ?? []) as LogRow[]

      const temp = new Map<string, Set<string>>()
      for (const l of logRows) {
        if (!temp.has(l.route_id)) temp.set(l.route_id, new Set())
        temp.get(l.route_id)!.add(l.profile_id)
      }
      for (const [routeId, users] of temp.entries()) {
        routeCompletersMap.set(routeId, users.size)
      }
      totalAchieved = Array.from(routeCompletersMap.values()).reduce((sum, n) => sum + n, 0)

      const allCompleterIds = Array.from(new Set(logRows.map((l) => l.profile_id)))
      if (allCompleterIds.length > 0) {
        const { data: completerProfiles } = await createAdminClient()
          .from('profiles')
          .select('id, name')
          .in('id', allCompleterIds)
        const nameById = new Map((completerProfiles ?? []).map((cp: { id: string; name: string }) => [cp.id, cp.name]))
        for (const [routeId, profileIds] of temp.entries()) {
          routeCompleterNamesMap.set(
            routeId,
            Array.from(profileIds).map((pid) => nameById.get(pid) ?? '알 수 없음'),
          )
        }
      }

      completedRouteIds = new Set(logRows.filter((l) => l.profile_id === user.id).map((l) => l.route_id))
      personalAchieved = completedRouteIds.size
    }
  } else {
    const { data: holdParticipants } = await supabase
      .from('event_participants')
      .select('user_id, profiles(name)')
      .eq('event_id', id)
      .is('route_id', null)
    type HoldParticipantRow = { user_id: string; profiles: { name: string } | null }
    const participantRows = (holdParticipants ?? []) as unknown as HoldParticipantRow[]
    const participantIds = participantRows.map((p) => p.user_id)

    let allHoldLogs: { profile_id: string; progress_hold_count: number }[] = []
    if (participantIds.length > 0) {
      const { data: logsData } = await supabase
        .from('exercise_logs')
        .select('profile_id, progress_hold_count')
        .in('profile_id', participantIds)
        .gte('logged_at', event.start_date)
        .lte('logged_at', `${event.end_date}T23:59:59`)
      allHoldLogs = (logsData ?? []) as { profile_id: string; progress_hold_count: number }[]
    }

    const holdCountMap = new Map<string, number>()
    for (const l of allHoldLogs) {
      holdCountMap.set(l.profile_id, (holdCountMap.get(l.profile_id) ?? 0) + (l.progress_hold_count ?? 0))
    }

    personalAchieved = holdCountMap.get(user.id) ?? 0
    totalAchieved = personalAchieved
    totalTarget = event.required_count

    holdParticipantDetails = participantRows
      .map((p) => ({
        userId: p.user_id,
        name: p.profiles?.name ?? '알 수 없음',
        achieved: holdCountMap.get(p.user_id) ?? 0,
        isDone: (holdCountMap.get(p.user_id) ?? 0) >= event.required_count,
      }))
      .sort((a, b) => b.achieved - a.achieved)
  }

  const isDone = personalAchieved >= event.required_count
  const overallPercent = totalTarget > 0 ? Math.min(100, Math.round((totalAchieved / totalTarget) * 100)) : 0

  const { data: rewardLog } = await supabase
    .from('event_reward_logs')
    .select('id, rewarded_at')
    .eq('event_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const today = new Date().toISOString().slice(0, 10)
  const effectiveStatus = event.status === 'active' && event.end_date < today ? 'ended' : event.status
  const statusLabel = effectiveStatus === 'active' ? '진행중' : effectiveStatus === 'ended' ? '종료' : '준비중'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--chalk)]">{event.title}</h1>
      <p className="mb-1 text-sm text-[var(--chalk-muted)]">{event.start_date} ~ {event.end_date}</p>
      <p className="mb-6 text-sm text-[var(--chalk-muted)]">상태: {statusLabel}</p>

      <div className="card mb-6 rounded-2xl p-5">
        <p className="mb-1 text-sm font-medium text-[var(--chalk-muted)]">이벤트 설명</p>
        <p className="whitespace-pre-wrap text-[var(--chalk)]">{event.description}</p>
      </div>

      <div className="card mb-6 rounded-2xl p-5">
        <p className="mb-1 text-sm font-medium text-[var(--chalk-muted)]">🎁 상품</p>
        <p className="font-semibold text-[var(--chalk)]">{event.prize_description}</p>
        {rewardLog && (
          <p className="mt-2 text-sm text-emerald-500">
            ✓ 상품 수령 완료 ({rewardLog.rewarded_at.slice(0, 10)})
          </p>
        )}
      </div>

      <EventParticipateSection
        eventId={id}
        userId={user.id}
        missionType={event.mission_type as 'route_completion' | 'hold_count'}
        eventRoutes={eventRouteDetails}
        participatingRouteIds={participatingRouteIds}
        isParticipatingHold={isParticipatingHold}
        eventStatus={event.status}
        fullRouteIds={eventRouteDetails
          .filter((er) => er.target_count > 0 && (routeCompletersMap.get(er.route_id) ?? 0) >= er.target_count)
          .map((er) => er.route_id)}
      />

      <div className="card rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--chalk-muted)]">
            {event.mission_type === 'route_completion' ? '전체 달성 현황' : '나의 진행한 홀드 수'}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--chalk)]">{totalAchieved} / {totalTarget} {event.mission_type === 'route_completion' ? '명' : '개'}</span>
            {totalTarget > 0 && totalAchieved >= totalTarget ? (
              <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-white">달성</span>
            ) : (
              <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs text-white">진행중</span>
            )}
          </div>
        </div>
        <div className="mb-5 h-3 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <div
            className={`h-full rounded-full transition-all ${totalAchieved >= totalTarget && totalTarget > 0 ? 'bg-emerald-500' : 'bg-[var(--primary)]'}`}
            style={{ width: `${overallPercent}%` }}
          />
        </div>

        {event.mission_type === 'hold_count' && holdParticipantDetails.length > 0 && (
          <ul className="mt-4 space-y-2">
            {holdParticipantDetails.map((p) => (
              <li key={p.userId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={p.isDone ? 'text-emerald-500' : 'text-[var(--chalk-muted)]'}>
                    {p.isDone ? '✓' : '○'}
                  </span>
                  <span className={p.userId === user.id ? 'font-semibold text-[var(--chalk)]' : 'text-[var(--chalk-muted)]'}>
                    {p.name}{p.userId === user.id ? ' (나)' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={p.isDone ? 'font-semibold text-emerald-500' : 'text-[var(--chalk-muted)]'}>
                    {p.achieved} / {event.required_count} 개
                  </span>
                  {p.isDone && (
                    <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs text-white">달성</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {event.mission_type === 'route_completion' && eventRouteDetails.length > 0 && (
          <ul className="space-y-4">
            {eventRouteDetails.map((er) => {
              const done = completedRouteIds.has(er.route_id)
              const route = er.routes
              const completers = routeCompletersMap.get(er.route_id) ?? 0
              const participants = routeParticipantsMap.get(er.route_id) ?? 0
              const participantNames = routeParticipantNamesMap.get(er.route_id) ?? []
              const completerNames = routeCompleterNamesMap.get(er.route_id) ?? []
              const routePercent = er.target_count > 0 ? Math.min(100, Math.round((completers / er.target_count) * 100)) : 0
              const routeFull = er.target_count > 0 && completers >= er.target_count
              return (
                <li key={er.route_id}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`text-base ${done ? 'text-emerald-500' : 'text-[var(--chalk-muted)]'}`}>
                      {done ? '✓' : '○'}
                    </span>
                    <span className={`flex-1 text-sm ${done ? 'text-[var(--chalk)]' : 'text-[var(--chalk-muted)]'}`}>
                      {route?.name ?? '알 수 없는 루트'}
                      {route && (
                        <span className="ml-1 text-xs text-[var(--chalk-muted)]">
                          ({WALL_TYPE_LABELS[route.wall_type as keyof typeof WALL_TYPE_LABELS] ?? route.wall_type} / {route.grade_value}{route.grade_detail})
                        </span>
                      )}
                      <span className="ml-1.5 text-xs text-[var(--chalk-muted)]">
                        참여 {participants}명{participantNames.length > 0 && ` (${participantNames.join(', ')})`}
                      </span>
                      {completerNames.length > 0 && (
                        <span className="ml-1.5 text-xs text-emerald-500">
                          미션성공 {completerNames.join(', ')}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[var(--chalk-muted)]">{completers} / {er.target_count} 명</span>
                      {routeFull ? (
                        <span className="rounded-full bg-yellow-500 px-1.5 py-0.5 text-xs text-white">달성</span>
                      ) : (
                        <span className="rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-xs text-white">진행중</span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                    <div
                      className={`h-full rounded-full transition-all ${routeFull ? 'bg-emerald-500' : 'bg-[var(--primary)]'}`}
                      style={{ width: `${routePercent}%` }}
                    />
                  </div>
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
