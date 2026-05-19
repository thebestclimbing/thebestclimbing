import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ProductImage } from '@/lib/shop/types'
import CartItemList from '@/components/shop/cart-item-list'

export default async function CartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/shop/cart')

  const { data: items } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      products (
        id, title, price, stock,
        product_images (id, url, is_primary, sort_order)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  const cartItems = (items ?? []).map((item) => {
    const product = (item as any).products
    const images = ((product?.product_images as ProductImage[]) ?? []).sort(
      (a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order
    )
    const primaryImage = images.find((img: ProductImage) => img.is_primary) ?? images[0]
    return {
      id: item.id,
      quantity: item.quantity,
      product: {
        id: product?.id,
        title: product?.title ?? '',
        price: product?.price ?? 0,
        stock: product?.stock ?? 0,
        imageUrl: primaryImage?.url ?? null,
      },
    }
  })

  const productIds = cartItems.map((item) => item.product.id).filter(Boolean)
  const { data: intents } = productIds.length > 0
    ? await supabase
        .from('purchase_intents')
        .select('product_id')
        .eq('user_id', user.id)
        .in('product_id', productIds)
    : { data: [] }
  const intentProductIds = (intents ?? []).map((i) => i.product_id)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <CartItemList items={cartItems} intentProductIds={intentProductIds} />
    </div>
  )
}
