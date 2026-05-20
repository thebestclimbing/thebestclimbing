'use client'

import { useState } from 'react'
import { toggleReward } from '../../actions'

export function RewardButton({
  eventId,
  userId,
  isRewarded,
}: {
  eventId: string
  userId: string
  isRewarded: boolean
}) {
  const [rewarded, setRewarded] = useState(isRewarded)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    const result = await toggleReward(eventId, userId, rewarded)
    setLoading(false)
    if (result.error) { alert(result.error); return }
    setRewarded((prev) => !prev)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-lg px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
        rewarded
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'border border-[var(--border)] text-[var(--chalk-muted)] hover:bg-[var(--surface-muted)]'
      }`}
    >
      {loading ? '...' : rewarded ? '✓ 지급완료' : '지급처리'}
    </button>
  )
}
