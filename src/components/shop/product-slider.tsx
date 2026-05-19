'use client'

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
  if (!products.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-sm text-slate-500">
        등록된 상품이 없습니다.
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
  )
}
