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
