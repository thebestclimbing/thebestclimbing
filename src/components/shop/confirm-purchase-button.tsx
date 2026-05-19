'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { confirmPurchase } from '@/app/shop/actions'

export default function ConfirmPurchaseButton({ intentId }: { intentId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = () => {
    if (!confirm('이 구매자로 구매를 확정할까요?')) return
    startTransition(async () => {
      const result = await confirmPurchase(intentId)
      if (!result.error) router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
    >
      {pending ? '처리중...' : '구매확정'}
    </button>
  )
}
