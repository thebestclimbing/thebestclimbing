'use client'

import { useTransition } from 'react'
import { cancelIntentBySeller } from '@/app/shop/actions'

export default function CancelIntentButton({ intentId }: { intentId: string }) {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      await cancelIntentBySeller(intentId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label="구매 희망 취소"
      className="p-1 text-slate-600 transition hover:text-red-400 disabled:opacity-40"
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}
