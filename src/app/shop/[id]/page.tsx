import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { ProductImage } from '@/lib/shop/types'
import AddToCartButton from '@/components/shop/add-to-cart-button'
import PurchaseIntentButton from '@/components/shop/purchase-intent-button'
import NoImagePlaceholder from '@/components/shop/no-image-placeholder'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select(
      `*, product_images (id, url, is_primary, sort_order),
       profiles (id, name, seller_status, is_admin),
       categories (id, name, slug)`
    )
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!product) notFound()

  type ProductRelations = {
    categories: { id: string; name: string; slug: string } | null
    profiles: { id: string; name: string } | null
  }
  const typedProduct = product as unknown as typeof product & ProductRelations

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = !!user && user.id === product.seller_id
  let intent: { id: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('purchase_intents')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', id)
      .maybeSingle()
    intent = data
  }

  const images = ((product.product_images as ProductImage[]) ?? []).sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const primaryImage = images.find((img) => img.is_primary) ?? images[0]

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
        {/* 이미지 */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-800">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={product.title}
                fill
                className="object-cover"
              />
            ) : (
              <NoImagePlaceholder />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative h-16 w-16 overflow-hidden rounded bg-slate-800"
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            {product.is_official && (
              <Badge className="bg-blue-600 text-white">공식 스토어</Badge>
            )}
            {typedProduct.categories && (
              <Badge variant="outline" className="border-slate-600 text-slate-400">
                {typedProduct.categories.name}
              </Badge>
            )}
          </div>

          <h1 className="mb-3 text-2xl font-bold text-white">{product.title}</h1>
          <p className="mb-6 text-3xl font-bold text-emerald-400">
            {Number(product.price).toLocaleString()}원
          </p>

          {product.description && (
            <div className="border-t border-slate-800 pt-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                상품 설명
              </h3>
              <p className="whitespace-pre-wrap text-slate-300">{product.description}</p>
            </div>
          )}

          <div className="mt-6 border-t border-slate-800 pt-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              판매자
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-white">
                {typedProduct.profiles?.name ?? '알 수 없음'}
              </span>
              {product.is_official && (
                <Badge variant="outline" className="border-blue-700 bg-blue-900 text-xs text-blue-300">
                  공식
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-slate-500">재고: {product.stock}개</p>
            <div className="flex gap-2">
              <PurchaseIntentButton productId={product.id} initialIntent={intent} isOwner={isOwner} />
              <AddToCartButton productId={product.id} stock={product.stock} isOwner={isOwner} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
