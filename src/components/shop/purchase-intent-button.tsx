'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { addPurchaseIntent, cancelPurchaseIntent } from '@/app/shop/actions'

interface Props {
  productId: string
  initialIntent: { id: string } | null
  isOwner?: boolean
  stock: number
  quantity: number
  onQuantityChange: (q: number) => void
}

export default function PurchaseIntentButton({ productId, initialIntent, isOwner, stock, quantity, onQuantityChange }: Props) {
  const [hasIntent, setHasIntent] = useState(initialIntent !== null)
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleAdd = async () => {
    setLoading(true)
    const result = await addPurchaseIntent(productId, quantity, memo)
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
    onQuantityChange(1)
    setMemo('')
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
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-full border border-slate-700 bg-slate-800">
          <button
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="px-3 py-2 text-sm text-slate-400 hover:text-white"
          >
            −
          </button>
          <span className="min-w-[1.5rem] text-center text-sm font-semibold text-white">{quantity}</span>
          <button
            onClick={() => onQuantityChange(Math.min(stock, quantity + 1))}
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
      <div className="absolute right-0 top-full z-10 mt-2 w-64">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="판매자에게 메모 (선택사항)"
          rows={2}
          className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white shadow-lg placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>
  )
}
