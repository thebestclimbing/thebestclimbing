import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('events')
    .select('id, title, prize_description, start_date, end_date')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(2)
  return NextResponse.json({ events: data ?? [] })
}
