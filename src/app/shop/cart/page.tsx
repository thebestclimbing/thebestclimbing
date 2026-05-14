import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { removeFromCart, updateCartQuantity } from '@/app/shop/actions'
import type { ProductImage } from '@/lib/shop/types'

export default async function CartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="mb-4 text-slate-400">장바구니가 비어있습니다.</p>
        <Link href="/shop/products" className="text-emerald-400 hover:text-emerald-300">
          쇼핑 계속하기 →
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-white">장바구니</h1>

      <ul className="space-y-4">
        {cartItems.map((item) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const decrementAction = updateCartQuantity.bind(null, item.id, item.quantity - 1) as any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const incrementAction = updateCartQuantity.bind(null, item.id, item.quantity + 1) as any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const deleteAction = removeFromCart.bind(null, item.id) as any

          return (
            <li
              key={item.id}
              className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              {/* 썸네일 */}
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
                {item.product.imageUrl ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl text-slate-600">
                    🧗
                  </div>
                )}
              </div>

              {/* 상품 정보 */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{item.product.title}</p>
                <p className="text-sm text-emerald-400">
                  {Number(item.product.price).toLocaleString()}원
                </p>
              </div>

              {/* 수량 조절 */}
              <div className="flex items-center gap-1">
                <form action={decrementAction}>
                  <button
                    type="submit"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-sm text-slate-400 hover:border-slate-500 hover:text-white"
                  >
                    −
                  </button>
                </form>
                <span className="w-8 text-center text-sm text-white">{item.quantity}</span>
                <form action={incrementAction}>
                  <button
                    type="submit"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-sm text-slate-400 hover:border-slate-500 hover:text-white"
                  >
                    +
                  </button>
                </form>
              </div>

              {/* 삭제 */}
              <form action={deleteAction}>
                <button type="submit" className="p-1 text-slate-600 hover:text-red-400" aria-label="삭제">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </form>
            </li>
          )
        })}
      </ul>

      {/* 합계 + 주문 버튼 */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-slate-400">총 금액</span>
          <span className="text-xl font-bold text-white">{total.toLocaleString()}원</span>
        </div>
        <button
          disabled
          className="w-full rounded-xl bg-slate-700 py-4 text-sm font-semibold text-slate-400"
        >
          주문하기 (준비 중)
        </button>
      </div>
    </div>
  )
}
