import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import SellerDashboardTabs from '@/components/shop/seller-dashboard-tabs'
import type { ProductImage } from '@/lib/shop/types'

export default async function SellerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: products } = await supabase
    .from('products')
    .select('id, title, price, status, product_images(id, url, is_primary, sort_order)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const productIds = (products ?? []).map((p) => p.id)
  const [{ data: intents }, { data: myIntentsRaw }] = await Promise.all([
    productIds.length > 0
      ? supabase
          .from('purchase_intents')
          .select('id, memo, product_id, profiles(name)')
          .in('product_id', productIds)
          .order('created_at', { ascending: false })
      : { data: [] },
    supabase
      .from('purchase_intents')
      .select('id, memo, products(id, title, price, product_images(id, url, is_primary, sort_order))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  type Buyer = { id: string; name: string | null; memo: string | null }
  type IntentWithBuyer = { product_id: string; profiles: { name: string } | null }
  const buyerMap = (intents ?? []).reduce<Record<string, Buyer[]>>((acc, intent) => {
    const i = intent as unknown as IntentWithBuyer
    const pid = i.product_id
    if (!acc[pid]) acc[pid] = []
    acc[pid].push({ id: intent.id, name: i.profiles?.name ?? null, memo: intent.memo as string | null })
    return acc
  }, {})

  const mergedProducts = (products ?? []).map((product) => {
    const images = ((product.product_images as unknown as ProductImage[]) ?? []).sort(
      (a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order
    )
    const primaryImage = images.find((img: ProductImage) => img.is_primary) ?? images[0]
    return {
      id: product.id,
      title: product.title,
      price: product.price,
      status: product.status,
      imageUrl: primaryImage?.url ?? null,
      buyers: buyerMap[product.id] ?? [],
    }
  })

  type MyIntentRow = { products: { id: string; title: string; price: number; product_images: ProductImage[] } | null }
  const myIntents = (myIntentsRaw ?? []).map((intent) => {
    const product = (intent as unknown as MyIntentRow).products
    const images = ((product?.product_images as ProductImage[]) ?? []).sort(
      (a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order
    )
    const primaryImage = images.find((img: ProductImage) => img.is_primary) ?? images[0]
    return {
      id: intent.id,
      memo: intent.memo as string | null,
      product: {
        id: product?.id ?? '',
        title: product?.title ?? '',
        price: product?.price ?? 0,
        imageUrl: primaryImage?.url ?? null,
      },
    }
  })

  type PurchaseHistoryRow = {
    id: string
    title: string
    price: number
    image_url: string | null
    confirmed_at: string
    product_id: string | null
  }
  const { data: purchaseHistoryRaw } = await supabase
    .from('purchase_history')
    .select('id, title, price, image_url, confirmed_at, product_id')
    .eq('buyer_id', user.id)
    .order('confirmed_at', { ascending: false })

  const purchaseHistory = ((purchaseHistoryRaw ?? []) as unknown as PurchaseHistoryRow[]).map((h) => ({
    id: h.id,
    title: h.title,
    price: h.price,
    imageUrl: h.image_url,
    confirmedAt: h.confirmed_at,
    productId: h.product_id,
  }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:py-8">
      <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-white md:text-2xl">MYBOARD</h1>
        <Link href="/shop/seller/products/new">
          <Button className="w-full sm:w-auto">+ 새 상품 등록</Button>
        </Link>
      </div>

      <SellerDashboardTabs
        mergedProducts={mergedProducts}
        myIntents={myIntents}
        purchaseHistory={purchaseHistory}
      />
    </div>
  )
}
