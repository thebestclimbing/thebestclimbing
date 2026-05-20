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

  const progressMap: Record<string, number> = {}

  if (event.mission_type === 'route_completion') {
    const { data: eventRoutes } = await supabase
      .from('event_routes')
      .select('route_id')
      .eq('event_id', id)
    const routeIds = (eventRoutes ?? []).map((r: { route_id: string }) => r.route_id)

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
        const l = log as { profile_id: string; route_id: string }
        if (!setMap[l.profile_id]) setMap[l.profile_id] = new Set()
        setMap[l.profile_id].add(l.route_id)
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
      const l = log as { profile_id: string }
      progressMap[l.profile_id] = (progressMap[l.profile_id] || 0) + 1
    }
  }

  const achieverIds = Object.entries(progressMap)
    .filter(([, count]) => count >= event.required_count)
    .map(([uid]) => uid)

  const [{ data: members }, { data: rewardLogs }] = await Promise.all([
    achieverIds.length > 0
      ? supabase.from('profiles').select('id, name').in('id', achieverIds)
      : { data: [] as { id: string; name: string }[] },
    supabase.from('event_reward_logs').select('user_id').eq('event_id', id),
  ])

  const rewardedSet = new Set((rewardLogs ?? []).map((r: { user_id: string }) => r.user_id))

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
