'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CartIcon() {
  const [count, setCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    const fetchCartCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !mounted) return

        const { count: c } = await supabase
          .from('cart_items')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (mounted) {
          setCount(c ?? 0)
        }
      } catch {
        // Error fetching cart or user - keep badge at 0
        if (mounted) {
          setCount(0)
        }
      }
    }

    fetchCartCount()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <button
      onClick={() => router.push('/shop/cart')}
      className="relative p-2 text-slate-400 transition-colors hover:text-white"
      aria-label="장바구니"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
