'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { addPurchaseIntent, cancelPurchaseIntent } from '@/app/shop/actions'

interface Props {
  productId: string
  initialIntent: { id: string } | null
  isOwner?: boolean
  stock: number
}

export default function PurchaseIntentButton({ productId, initialIntent, isOwner, stock }: Props) {
  const [hasIntent, setHasIntent] = useState(initialIntent !== null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleAdd = async () => {
    setLoading(true)
    const result = await addPurchaseIntent(productId, quantity)
    setLoading(false)
    if (result?.error === 'unauthenticated') { router.push(`/login?next=${encodeURIComponent(pathname)}`); return }
    if (result?.error) return
    setHasIntent(true)
  }

  const handleCancel = async () => {
    setLoading(true)
    const result = await cancelPurchaseIntent(productId)
    setLoading(false)
    if (result?.error) return
    setHasIntent(false)
    setQuantity(1)
  }

  if (isOwner) return null

  if (hasIntent) {
    return (
      <button
        onClick={handleCancel}
        disabled={loading}
        className="rounded-full bg-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 shadow-lg transition hover:bg-red-900 hover:text-red-300 disabled:opacity-70"
      >
        {loading ? '...' : '구매중 ✕'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-full border border-slate-700 bg-slate-800">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="px-3 py-2 text-sm text-slate-400 hover:text-white"
        >
          −
        </button>
        <span className="min-w-[1.5rem] text-center text-sm font-semibold text-white">{quantity}</span>
        <button
          onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
          disabled={quantity >= stock}
          className="px-3 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-40"
        >
          +
        </button>
      </div>
      <button
        onClick={handleAdd}
        disabled={loading || stock === 0}
        className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500 disabled:opacity-70"
      >
        {loading ? '...' : '🛍️ 구매'}
      </button>
    </div>
  )
}
