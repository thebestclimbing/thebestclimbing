'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addPurchaseIntent, cancelPurchaseIntent } from '@/app/shop/actions'

interface Props {
  productId: string
  initialIntent: { id: string } | null
  isOwner?: boolean
}

export default function PurchaseIntentButton({ productId, initialIntent, isOwner }: Props) {
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

  if (isOwner) return null

  return hasIntent ? (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="rounded-full bg-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 shadow-lg transition hover:bg-red-900 hover:text-red-300 disabled:opacity-70"
    >
      {loading ? '...' : '구매중 ✕'}
    </button>
  ) : (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500 disabled:opacity-70"
    >
      {loading ? '...' : '🛍️ 구매'}
    </button>
  )
}
