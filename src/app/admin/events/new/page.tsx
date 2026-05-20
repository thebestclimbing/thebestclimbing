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
