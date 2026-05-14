'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addPurchaseIntent, cancelPurchaseIntent } from '@/app/shop/actions'

interface Props {
  productId: string
  initialIntent: { id: string } | null
}

export default function PurchaseIntentButton({ productId, initialIntent }: Props) {
  const [hasIntent, setHasIntent] = useState(initialIntent !== null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAdd = async () => {
    setLoading(true)
    const result = await addPurchaseIntent(productId)
    setLoading(false)
    if (result?.error === 'unauthenticated') { router.push('/login'); return }
    if (result?.error) return
    setHasIntent(true)
  }

  const handleCancel = async () => {
    setLoading(true)
    const result = await cancelPurchaseIntent(productId)
    setLoading(false)
    if (result?.error) return
    setHasIntent(false)
  }

  return (
    <div className="fixed bottom-[85px] left-0 right-0 z-40 bg-slate-950 px-4 pb-2 pt-3">
      {hasIntent ? (
        <button
          onClick={handleCancel}
          disabled={loading}
          className="w-full rounded-xl bg-slate-700 py-4 text-sm font-semibold text-slate-300 transition hover:bg-red-900 hover:text-red-300 disabled:opacity-70"
        >
          {loading ? '처리 중...' : '구매중 (취소하려면 클릭)'}
        </button>
      ) : (
        <button
          onClick={handleAdd}
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70"
        >
          {loading ? '처리 중...' : '구매'}
        </button>
      )}
    </div>
  )
}
