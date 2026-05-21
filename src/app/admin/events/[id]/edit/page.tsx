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

  const [{ data: event }, { data: routes }, { data: eventRoutes }, { data: activeEvents }] = await Promise.all([
    supabase.from('events')
      .select('id, title, description, prize_description, mission_type, required_count, start_date, end_date, status')
      .eq('id', id).single(),
    supabase.from('routes').select('id, name, wall_type, grade_value, grade_detail').order('wall_type').order('grade_value'),
    supabase.from('event_routes').select('route_id, target_count').eq('event_id', id),
    supabase.from('events').select('id').eq('status', 'active').neq('id', id),
  ])

  if (!event) notFound()

  const activeEventIds = (activeEvents ?? []).map((e: { id: string }) => e.id)
  let busyRouteIds: string[] = []
  if (activeEventIds.length > 0) {
    const { data: busyRoutes } = await supabase.from('event_routes').select('route_id').in('event_id', activeEventIds)
    busyRouteIds = (busyRoutes ?? []).map((r: { route_id: string }) => r.route_id)
  }

  const initial = {
    ...event,
    mission_type: event.mission_type as 'route_completion' | 'hold_count',
    status: event.status as 'draft' | 'active' | 'ended',
    selectedRoutes: (eventRoutes ?? []).map((r) => ({ route_id: r.route_id, target_count: r.target_count ?? 0 })),
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">이벤트 수정</h1>
      <EventForm routes={routes ?? []} event={initial} busyRouteIds={busyRouteIds} />
      <p className="mt-6">
        <Link href="/admin/events" className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]">목록으로</Link>
      </p>
    </div>
  )
}
