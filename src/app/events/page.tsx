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
  status: string
}

type RouteWithTarget = { route_id: string; target_count: number }
type LogRow = { profile_id: string; route_id: string }

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/events')

  const { data: events } = await supabase
    .from('events')
    .select('id, title, prize_description, mission_type, required_count, start_date, end_date, status')
    .in('status', ['active', 'ended'])
    .order('status')
    .order('created_at', { ascending: false })

  const progressList = await Promise.all(
    (events ?? []).map(async (event: EventRow) => {
      if (event.mission_type !== 'route_completion') {
        const [{ data: holdLogs }, { data: participation }] = await Promise.all([
          supabase
            .from('exercise_logs')
            .select('progress_hold_count')
            .eq('profile_id', user.id)
            .gte('logged_at', event.start_date)
            .lte('logged_at', event.end_date),
          supabase
            .from('event_participants')
            .select('id')
            .eq('event_id', event.id)
            .eq('user_id', user.id)
            .is('route_id', null)
            .limit(1),
        ])
        const achieved = (holdLogs ?? []).reduce((sum, l: { progress_hold_count: number }) => sum + (l.progress_hold_count ?? 0), 0)
        const isParticipatingHold = (participation?.length ?? 0) > 0
        return { eventId: event.id, personalAchieved: achieved, totalAchieved: achieved, totalTarget: event.required_count, isParticipatingHold }
      }

      const { data: eventRoutes } = await supabase
        .from('event_routes')
        .select('route_id, target_count')
        .eq('event_id', event.id)
      const erRows = (eventRoutes ?? []) as RouteWithTarget[]
      const routeIds = erRows.map((r) => r.route_id)
      const totalTarget = erRows.reduce((sum, r) => sum + (r.target_count ?? 0), 0)

      if (routeIds.length === 0) {
        return { eventId: event.id, personalAchieved: 0, totalAchieved: 0, totalTarget: 0 }
      }

      const { data: logs } = await supabase
        .from('exercise_logs')
        .select('profile_id, route_id')
        .in('route_id', routeIds)
        .eq('is_completed', true)
        .gte('logged_at', event.start_date)
        .lte('logged_at', event.end_date)
      const logRows = (logs ?? []) as LogRow[]

      const routeCompleters = new Map<string, Set<string>>()
      for (const l of logRows) {
        if (!routeCompleters.has(l.route_id)) routeCompleters.set(l.route_id, new Set())
        routeCompleters.get(l.route_id)!.add(l.profile_id)
      }
      const totalAchieved = Array.from(routeCompleters.values()).reduce((sum, s) => sum + s.size, 0)

      const personalCompleted = new Set(logRows.filter((l) => l.profile_id === user.id).map((l) => l.route_id))
      const personalAchieved = personalCompleted.size

      return { eventId: event.id, personalAchieved, totalAchieved, totalTarget }
    })
  )

  const progressMap = Object.fromEntries(progressList.map((p) => [p.eventId, p]))

  const { data: rewardLogs } = await supabase
    .from('event_reward_logs')
    .select('event_id')
    .eq('user_id', user.id)
  const rewardedSet = new Set((rewardLogs ?? []).map((r: { event_id: string }) => r.event_id))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">이벤트</h1>
      {(!events || events.length === 0) ? (
        <p className="text-[var(--chalk-muted)]">이벤트가 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(events as EventRow[]).map((event) => {
            const prog = progressMap[event.id] ?? { personalAchieved: 0, totalAchieved: 0, totalTarget: event.required_count }
            const isEventFull = prog.totalTarget > 0 && prog.totalAchieved >= prog.totalTarget
            const isRewarded = rewardedSet.has(event.id)
            const percent = prog.totalTarget > 0 ? Math.min(100, Math.round((prog.totalAchieved / prog.totalTarget) * 100)) : 0
            return (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--primary)]">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-[var(--chalk)]">{event.title}</h2>
                    {isRewarded ? (
                      <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-xs text-white">수령완료</span>
                    ) : event.status === 'ended' ? (
                      isEventFull ? (
                        <span className="shrink-0 rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-white">달성</span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-[var(--chalk-muted)] px-2 py-0.5 text-xs text-white">종료</span>
                      )
                    ) : event.mission_type === 'hold_count' && !prog.isParticipatingHold ? (
                      <div className="flex shrink-0 gap-1">
                        <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs text-white">진행중</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs text-white ${isEventFull ? 'bg-yellow-500' : 'bg-[var(--chalk-muted)]'}`}>
                          {isEventFull ? '미션조건달성' : '미션조건미달성'}
                        </span>
                      </div>
                    ) : isEventFull ? (
                      <span className="shrink-0 rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-white">달성</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs text-white">진행중</span>
                    )}
                  </div>
                  <p className="mb-3 text-sm text-[var(--chalk-muted)]">🎁 {event.prize_description}</p>
                  <p className="mb-2 text-xs text-[var(--chalk-muted)]">{event.start_date} ~ {event.end_date}</p>
                  <div className="mb-1 flex items-center justify-between text-xs text-[var(--chalk-muted)]">
                    <span>{event.mission_type === 'route_completion' ? '루트 완등 현황' : '나의 진행한 홀드 수'}</span>
                    <span className={prog.totalAchieved >= prog.totalTarget && prog.totalTarget > 0 ? 'font-semibold text-emerald-500' : ''}>
                      {prog.totalAchieved} / {prog.totalTarget} {event.mission_type === 'route_completion' ? '명' : '개'}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                    <div
                      className={`h-full rounded-full transition-all ${prog.totalAchieved >= prog.totalTarget && prog.totalTarget > 0 ? 'bg-emerald-500' : 'bg-[var(--primary)]'}`}
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
