'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function toggleReward(eventId: string, userId: string, isCurrentlyRewarded: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'unauthorized' }

  const admin = createAdminClient()
  if (isCurrentlyRewarded) {
    await admin.from('event_reward_logs').delete().eq('event_id', eventId).eq('user_id', userId)
  } else {
    await admin.from('event_reward_logs').upsert({ event_id: eventId, user_id: userId })
  }

  revalidatePath(`/admin/events/${eventId}/achievements`)
  return { error: null }
}
