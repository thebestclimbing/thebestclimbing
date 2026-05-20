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
