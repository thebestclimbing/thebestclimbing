'use client'

import { useState } from 'react'
import PurchaseIntentButton from './purchase-intent-button'
import AddToCartButton from './add-to-cart-button'

interface Props {
  productId: string
  initialIntent: { id: string } | null
  isOwner?: boolean
  stock: number
}

export default function ProductActions({ productId, initialIntent, isOwner, stock }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [memo, setMemo] = useState('')
  const [hasIntent, setHasIntent] = useState(initialIntent !== null)

  const handleIntentChange = (v: boolean) => {
    setHasIntent(v)
    if (!v) { setMemo(''); setQuantity(1) }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 justify-end">
        <PurchaseIntentButton
          productId={productId}
          isOwner={isOwner}
          stock={stock}
          quantity={quantity}
          onQuantityChange={setQuantity}
          memo={memo}
          hasIntent={hasIntent}
          onIntentChange={handleIntentChange}
        />
        <AddToCartButton
          productId={productId}
          stock={stock}
          isOwner={isOwner}
          quantity={quantity}
        />
      </div>
      {!isOwner && !hasIntent && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-400">요청사항</p>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="판매자에게 메모 (선택사항)"
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}
