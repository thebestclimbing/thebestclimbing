'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { addToCart } from '@/app/shop/actions'

interface Props {
  productId: string
  stock: number
  isOwner?: boolean
}

export default function AddToCartButton({ productId, stock, isOwner }: Props) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!added) return
    const timer = setTimeout(() => setAdded(false), 1500)
    return () => clearTimeout(timer)
  }, [added])

  if (isOwner) {
    return (
      <button disabled className="rounded-full bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-500 shadow-lg cursor-not-allowed">
        내 상품
      </button>
    )
  }

  if (stock === 0) {
    return (
      <button
        disabled
        className="rounded-full bg-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-400 shadow-lg"
      >
        품절
      </button>
    )
  }

  const handleClick = async () => {
    setLoading(true)
    const result = await addToCart(productId, 1)
    setLoading(false)

    if (result?.error === 'unauthenticated') {
      router.push(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }

    if (result?.error) {
      return
    }

    setAdded(true)
    window.dispatchEvent(new CustomEvent('cart-updated'))
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || added}
      className="rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-500 disabled:opacity-70"
    >
      {added ? '✓ 담김' : loading ? '...' : '🛒 담기'}
    </button>
  )
}
