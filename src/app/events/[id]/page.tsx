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
    eventRouteDetails = (eventRoutes ?? []) as unknown as RouteDetail[]
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

  const statusLabel = event.status === 'active' ? '진행중' : event.status === 'ended' ? '종료' : '준비중'

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

      <div className="card rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--chalk-muted)]">
            {event.mission_type === 'route_completion' ? '루트 완등 현황' : '완등 횟수 현황'}
          </p>
          <span className={`text-sm font-semibold ${isDone ? 'text-emerald-500' : 'text-[var(--chalk)]'}`}>
            {achieved} / {event.required_count}{isDone && ' 달성!'}
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
                    {route?.name ?? '알 수 없는 루트'}
                    {route && <span className="ml-1 text-xs text-[var(--chalk-muted)]">({route.wall_type} / {route.grade_value})</span>}
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
