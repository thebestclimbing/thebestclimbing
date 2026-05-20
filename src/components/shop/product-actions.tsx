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

  return (
    <div className="flex gap-2">
      <PurchaseIntentButton
        productId={productId}
        initialIntent={initialIntent}
        isOwner={isOwner}
        stock={stock}
        quantity={quantity}
        onQuantityChange={setQuantity}
      />
      <AddToCartButton
        productId={productId}
        stock={stock}
        isOwner={isOwner}
        quantity={quantity}
      />
    </div>
  )
}
