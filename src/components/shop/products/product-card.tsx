import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/lib/shop/types'
import NoImagePlaceholder from '@/components/shop/no-image-placeholder'

export default function ProductCard({ product }: { product: Product }) {
  const primaryImage =
    product.product_images?.find((img) => img.is_primary) ??
    product.product_images?.[0]

  return (
    <Link href={`/shop/${product.id}`} className="group">
      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900 transition-colors hover:border-slate-600">
        <div className="relative aspect-square bg-slate-800">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <NoImagePlaceholder />
          )}
          {product.is_official && (
            <Badge className="absolute left-2 top-2 bg-blue-600 text-xs text-white">
              공식
            </Badge>
          )}
        </div>
        <div className="p-3">
          <p className="line-clamp-2 text-sm font-medium text-white">
            {product.title}
          </p>
          <p className="mt-1 font-bold text-emerald-400">
            {Number(product.price).toLocaleString()}원
          </p>
          {product.profiles?.name && (
            <p className="mt-1 text-xs text-slate-500">{product.profiles.name}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
