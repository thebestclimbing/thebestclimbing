'use client'

import { useOptimistic, useTransition, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { removeFromCart, updateCartQuantity, clearCart, addPurchaseIntentsFromCart } from '@/app/shop/actions'
import NoImagePlaceholder from '@/components/shop/no-image-placeholder'

type CartItem = {
  id: string
  quantity: number
  product: {
    id: string
    title: string
    price: number
    stock: number
    imageUrl: string | null
  }
}

type Action =
  | { type: 'update'; id: string; quantity: number }
  | { type: 'remove'; id: string }
  | { type: 'clear' }

function reducer(items: CartItem[], action: Action): CartItem[] {
  if (action.type === 'clear') return []
  if (action.type === 'remove') return items.filter((i) => i.id !== action.id)
  return items.map((i) =>
    i.id === action.id ? { ...i, quantity: action.quantity } : i
  )
}

export default function CartItemList({
  items,
  intentProductIds,
}: {
  items: CartItem[]
  intentProductIds: string[]
}) {
  const intentSet = new Set(intentProductIds)
  const [optimisticItems, dispatch] = useOptimistic(items, reducer)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(items.filter((i) => !intentSet.has(i.product.id)).map((i) => i.product.id))
  )
  const [ordering, setOrdering] = useState(false)

  const toggleCheck = (productId: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const newlyChecked = [...checked].filter((id) => !intentSet.has(id))

  const handleOrder = async () => {
    if (newlyChecked.length === 0) return
    if (!confirm(`선택한 ${newlyChecked.length}개 상품에 구매 희망을 신청할까요?`)) return
    setOrdering(true)
    const items = newlyChecked.map((productId) => {
      const item = optimisticItems.find((i) => i.product.id === productId)
      return { productId, quantity: item?.quantity ?? 1 }
    })
    const result = await addPurchaseIntentsFromCart(items)
    setOrdering(false)
    if (!result.error) router.refresh()
  }

  const handleQuantity = (item: CartItem, newQty: number) => {
    startTransition(async () => {
      if (newQty < 1) {
        dispatch({ type: 'remove', id: item.id })
        await removeFromCart(item.id)
        window.dispatchEvent(new CustomEvent('cart-updated'))
      } else {
        dispatch({ type: 'update', id: item.id, quantity: newQty })
        await updateCartQuantity(item.id, newQty)
      }
    })
  }

  const handleRemove = (id: string) => {
    startTransition(async () => {
      dispatch({ type: 'remove', id })
      await removeFromCart(id)
      window.dispatchEvent(new CustomEvent('cart-updated'))
    })
  }

  const handleClearAll = () => {
    startTransition(async () => {
      dispatch({ type: 'clear' })
      await clearCart()
      window.dispatchEvent(new CustomEvent('cart-updated'))
    })
  }

  const total = optimisticItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  if (optimisticItems.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-slate-400">장바구니가 비어있습니다.</p>
        <Link href="/shop/products" className="text-emerald-400 hover:text-emerald-300">
          쇼핑 계속하기 →
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">장바구니</h1>
        <button
          onClick={handleClearAll}
          aria-label="장바구니 비우기"
          className="rounded-full border border-slate-700 p-2 text-slate-500 transition hover:border-red-800 hover:bg-red-950 hover:text-red-400"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <ul className="space-y-4">
        {optimisticItems.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4"
          >
            {/* 체크박스 */}
            <input
              type="checkbox"
              checked={intentSet.has(item.product.id) || checked.has(item.product.id)}
              disabled={intentSet.has(item.product.id)}
              onChange={() => toggleCheck(item.product.id)}
              className="h-4 w-4 shrink-0 accent-emerald-500 disabled:opacity-50"
            />
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
                <NoImagePlaceholder />
              )}
            </div>

            {/* 상품 정보 */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-white">{item.product.title}</p>
                {intentSet.has(item.product.id) && (
                  <span className="shrink-0 rounded-full bg-blue-900 px-2 py-0.5 text-xs font-semibold text-blue-300">
                    구매중
                  </span>
                )}
              </div>
              <p className="text-sm text-emerald-400">
                {Number(item.product.price).toLocaleString()}원
              </p>
            </div>

            {/* 수량 조절 */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleQuantity(item, item.quantity - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-sm text-slate-400 hover:border-slate-500 hover:text-white"
              >
                −
              </button>
              <span className="w-8 text-center text-sm text-white">{item.quantity}</span>
              <button
                onClick={() => handleQuantity(item, item.quantity + 1)}
                disabled={item.quantity >= item.product.stock}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-sm text-slate-400 hover:border-slate-500 hover:text-white disabled:opacity-40"
              >
                +
              </button>
            </div>

            {/* 삭제 */}
            <button
              onClick={() => handleRemove(item.id)}
              className="p-1 text-slate-600 hover:text-red-400"
              aria-label="삭제"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {/* 합계 + 주문 버튼 */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-slate-400">총 금액</span>
          <span className="text-xl font-bold text-white">{total.toLocaleString()}원</span>
        </div>
        <button
          onClick={handleOrder}
          disabled={newlyChecked.length === 0 || ordering}
          className="w-full rounded-xl py-4 text-sm font-semibold transition disabled:bg-slate-700 disabled:text-slate-400 enabled:bg-emerald-600 enabled:text-white enabled:hover:bg-emerald-500"
        >
          {ordering ? '처리중...' : `주문하기${newlyChecked.length > 0 ? ` (${newlyChecked.length}개)` : ''}`}
        </button>
      </div>
    </>
  )
}
