'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import NoImagePlaceholder from '@/components/shop/no-image-placeholder'

interface SlideProduct {
  id: string
  title: string
  price: number
  imageUrl: string | null
}

export default function ProductSlider({ products }: { products: SlideProduct[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
  }

  if (!products.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-sm text-slate-500">
        등록된 상품이 없습니다.
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 왼쪽 버튼 */}
      <button
        onClick={() => scroll('left')}
        className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-slate-800 p-2 text-white shadow-lg transition hover:bg-slate-700 hidden sm:flex items-center justify-center"
        aria-label="이전"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 슬라이더 */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/shop/${p.id}`}
            className="flex w-36 flex-shrink-0 flex-col [scroll-snap-align:start] md:w-44"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-800">
              {p.imageUrl ? (
                <Image src={p.imageUrl} alt={p.title} fill className="object-cover transition group-hover:scale-105" />
              ) : (
                <NoImagePlaceholder />
              )}
            </div>
            <p className="mt-2 truncate text-sm font-medium text-white">{p.title}</p>
            <p className="text-xs text-slate-400">{Number(p.price).toLocaleString()}원</p>
          </Link>
        ))}
      </div>

      {/* 오른쪽 버튼 */}
      <button
        onClick={() => scroll('right')}
        className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-slate-800 p-2 text-white shadow-lg transition hover:bg-slate-700 hidden sm:flex items-center justify-center"
        aria-label="다음"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
