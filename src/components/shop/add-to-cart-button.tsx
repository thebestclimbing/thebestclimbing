'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart } from '@/app/shop/actions'

interface Props {
  productId: string
  stock: number
}

export default function AddToCartButton({ productId, stock }: Props) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const router = useRouter()

  if (stock === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950 px-4 py-4">
        <button
          disabled
          className="w-full rounded-xl bg-slate-700 py-4 text-sm font-semibold text-slate-400"
        >
          품절
        </button>
      </div>
    )
  }

  const handleClick = async () => {
    setLoading(true)
    const result = await addToCart(productId, 1)
    setLoading(false)

    if (result?.error === 'unauthenticated') {
      router.push('/login')
      return
    }

    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950 px-4 py-4">
      <button
        onClick={handleClick}
        disabled={loading || added}
        className="w-full rounded-xl bg-emerald-600 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-70"
      >
        {added ? '담겼습니다 ✓' : loading ? '처리 중...' : '장바구니 담기'}
      </button>
    </div>
  )
}
