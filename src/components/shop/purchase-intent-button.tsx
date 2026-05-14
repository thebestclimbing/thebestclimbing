'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addPurchaseIntent } from '@/app/shop/actions'

interface Props {
  productId: string
  initialIntent: { id: string } | null
}

export default function PurchaseIntentButton({ productId, initialIntent }: Props) {
  const [hasIntent, setHasIntent] = useState(initialIntent !== null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    const result = await addPurchaseIntent(productId)
    setLoading(false)
    if (result?.error === 'unauthenticated') { router.push('/login'); return }
    if (result?.error) return
    setHasIntent(true)
  }

  return (
    <div className="fixed bottom-[85px] left-0 right-0 z-40 bg-slate-950 px-4 pb-2 pt-3">
      {hasIntent ? (
        <button
          disabled
          className="w-full rounded-xl bg-slate-700 py-4 text-sm font-semibold text-slate-400"
        >
          구매중
        </button>
      ) : (
        <button
          onClick={handleClick}
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70"
        >
          {loading ? '처리 중...' : '구매'}
        </button>
      )}
    </div>
  )
}
