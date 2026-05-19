'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CartIcon() {
  const [count, setCount] = useState(0)
  const router = useRouter()

  const fetchCount = useCallback(async () => {
    let mounted = true
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return
      const { count: c } = await supabase
        .from('cart_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if (mounted) setCount(c ?? 0)
    } catch {
      // 에러 시 뱃지 0 유지
    }
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  useEffect(() => {
    const handler = () => fetchCount()
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [fetchCount])

  return (
    <button
      onClick={() => router.push('/shop/cart')}
      className="relative p-1 text-slate-400 transition-colors hover:text-white"
      aria-label="장바구니"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 9H4l1-9z" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
