'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import CartIcon from '@/components/shop/cart-icon'

interface Profile {
  is_admin: boolean | null
}

export default function ShopNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setProfile(data))
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (!session) setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* 로고 + 데스크톱 링크 */}
          <div className="flex items-center gap-6">
            <Link href="/shop" className="text-lg font-bold text-white">
              BestShop
            </Link>
            <div className="hidden items-center gap-5 sm:flex">
              <Link href="/shop/products?filter=official" className="text-sm text-slate-400 transition-colors hover:text-white">
                CENTER
              </Link>
              <Link href="/shop/products?filter=member" className="text-sm text-slate-400 transition-colors hover:text-white">
                MEMBER
              </Link>
            </div>
          </div>

          {/* 데스크톱 우측 */}
          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/" className="flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white">
              <Image src="/favicon.png" alt="BestClimbing" width={16} height={16} className="rounded-sm" />
              GO
            </Link>
            <CartIcon />
            {user ? (
              <>
                <Link href="/shop/seller" className="text-sm text-slate-400 transition-colors hover:text-white">
                  MYBOARD
                </Link>
                {profile?.is_admin && (
                  <Link href="/shop/admin" className="text-sm text-slate-400 transition-colors hover:text-white">
                    관리자
                  </Link>
                )}
                <button onClick={handleLogout} className="text-sm text-slate-400 transition-colors hover:text-white">
                  로그아웃
                </button>
              </>
            ) : (
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="text-sm text-slate-400 transition-colors hover:text-white">
                로그인
              </Link>
            )}
          </div>

          {/* 모바일 햄버거 */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white sm:hidden"
            aria-label="메뉴 열기"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* 모바일 드로어 */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/60 sm:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed right-0 top-0 z-[70] flex h-full w-72 max-w-[85vw] flex-col border-l border-slate-800 bg-slate-950 sm:hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
              <span className="font-bold text-white">BestShop</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="닫기"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1 overflow-y-auto p-4">
              <Link href="/shop/cart" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-200 hover:bg-slate-800">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 9H4l1-9z" />
                </svg>
                장바구니
              </Link>
              <Link href="/shop/products" className="rounded-xl px-4 py-3 text-slate-200 hover:bg-slate-800">
                전체 상품
              </Link>
              <Link href="/shop/products?filter=official" className="rounded-xl px-4 py-3 text-slate-200 hover:bg-slate-800">
                🏪 CENTER
              </Link>
              <Link href="/shop/products?filter=member" className="rounded-xl px-4 py-3 text-slate-200 hover:bg-slate-800">
                🧗 MEMBER
              </Link>
              <div className="my-2 border-t border-slate-800" />
              {user ? (
                <>
                  <Link href="/shop/seller" className="rounded-xl px-4 py-3 text-slate-200 hover:bg-slate-800">
                    MYBOARD
                  </Link>
                  {profile?.is_admin && (
                    <Link href="/shop/admin" className="rounded-xl px-4 py-3 text-slate-200 hover:bg-slate-800">
                      관리자
                    </Link>
                  )}
                  <div className="my-2 border-t border-slate-800" />
                  <button
                    onClick={handleLogout}
                    className="rounded-xl px-4 py-3 text-left text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="rounded-xl px-4 py-3 text-slate-200 hover:bg-slate-800">
                  로그인
                </Link>
              )}
              <div className="my-2 border-t border-slate-800" />
              <Link href="/" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
                <Image src="/favicon.png" alt="BestClimbing" width={20} height={20} className="rounded-sm" />
                베스트클라이밍으로 GO
              </Link>
            </nav>
          </div>
        </>
      )}
    </>
  )
}
