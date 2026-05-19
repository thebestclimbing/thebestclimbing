'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ConfirmPurchaseButton from '@/components/shop/confirm-purchase-button'
import NoImagePlaceholder from '@/components/shop/no-image-placeholder'
import { updateIntentMemo, cancelPurchaseIntent } from '@/app/shop/actions'

type MergedProduct = {
  id: string
  title: string
  price: number
  status: string
  imageUrl: string | null
  buyers: { id: string; name: string | null; memo: string | null }[]
}

type MyIntent = {
  id: string
  memo: string | null
  product: { id: string; title: string; price: number; imageUrl: string | null }
}

type PurchaseHistoryItem = {
  id: string
  title: string
  price: number
  imageUrl: string | null
  confirmedAt: string
  productId: string | null
}

interface Props {
  mergedProducts: MergedProduct[]
  myIntents: MyIntent[]
  purchaseHistory: PurchaseHistoryItem[]
}

function BuyerRow({ buyer, isSold }: { buyer: { id: string; name: string | null; memo: string | null }; isSold: boolean }) {
  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-300">{buyer.name ?? '(이름 없음)'}</span>
        {!isSold && <ConfirmPurchaseButton intentId={buyer.id} />}
      </div>
      <p className="mt-0.5 pl-3 whitespace-pre-wrap text-sm text-slate-400">{buyer.memo || '메모 없음'}</p>
    </div>
  )
}

function MyIntentRow({ intent, onCancel }: { intent: MyIntent; onCancel: (productId: string) => void }) {
  const [memo, setMemo] = useState(intent.memo ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const formData = new FormData()
    formData.set('memo', memo)
    await updateIntentMemo(intent.id, formData)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleCancel = async () => {
    setCancelling(true)
    await cancelPurchaseIntent(intent.product.id)
    onCancel(intent.product.id)
  }

  return (
    <div className="flex gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4">
      <Link href={`/shop/${intent.product.id}`} className="flex-shrink-0">
        <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-slate-800">
          {intent.product.imageUrl ? (
            <Image src={intent.product.imageUrl} alt={intent.product.title} fill className="object-cover" />
          ) : (
            <NoImagePlaceholder />
          )}
        </div>
      </Link>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <Link href={`/shop/${intent.product.id}`}>
            <p className="truncate font-medium text-white hover:text-emerald-400">{intent.product.title}</p>
          </Link>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-50"
          >
            취소
          </button>
        </div>
        <p className="mb-2 text-sm text-slate-400">{Number(intent.product.price).toLocaleString()}원</p>
        <div className="flex gap-2">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="판매자에게 메모..."
            rows={2}
            className="flex-1 resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {saved ? '✓' : saving ? '...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SellerDashboardTabs({ mergedProducts, myIntents: initialMyIntents, purchaseHistory }: Props) {
  const [tab, setTab] = useState(0)
  const [myIntents, setMyIntents] = useState(initialMyIntents)

  const handleCancelMyIntent = (productId: string) => {
    setMyIntents((prev) => prev.filter((i) => i.product.id !== productId))
  }

  return (
    <div>
      <div className="mb-6 flex border-b border-slate-800">
        <button
          onClick={() => setTab(0)}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === 0 ? 'border-b-2 border-purple-400 text-purple-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          내 상품
          <span className="ml-1.5 rounded-full bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
            {mergedProducts.length}
          </span>
        </button>
        <button
          onClick={() => setTab(1)}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === 1 ? 'border-b-2 border-blue-400 text-blue-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          구매중
          <span className="ml-1.5 rounded-full bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
            {myIntents.length}
          </span>
        </button>
        <button
          onClick={() => setTab(2)}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === 2 ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          구매이력
          <span className="ml-1.5 rounded-full bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
            {purchaseHistory.length}
          </span>
        </button>
      </div>

      {/* 패널 0: 구매 희망 현황 (상품 전체 + 구매자 목록) */}
      {tab === 0 && (
        <div>
          {mergedProducts.length === 0 ? (
            <p className="py-10 text-center text-slate-500">등록된 상품이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {mergedProducts.map((product) => (
                <div key={product.id} className="rounded-lg border border-slate-800 bg-slate-900">
                  <div className={`flex items-center gap-3 px-4 py-3 ${product.buyers.length > 0 ? 'border-b border-slate-800' : ''}`}>
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt={product.title} fill className="object-cover" />
                      ) : (
                        <NoImagePlaceholder />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{product.title}</p>
                      <p className="text-xs text-slate-400">{Number(product.price).toLocaleString()}원</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          product.status === 'active'
                            ? 'border-emerald-700 text-emerald-400'
                            : product.status === 'draft'
                            ? 'border-slate-600 text-slate-400'
                            : product.status === 'sold'
                            ? 'border-blue-700 text-blue-400'
                            : 'border-red-700 text-red-400'
                        }
                      >
                        {product.status === 'active' ? '판매중' : product.status === 'draft' ? '임시저장' : product.status === 'sold' ? '판매완료' : '비활성'}
                      </Badge>
                      <Link href={`/shop/seller/products/${product.id}/edit`}>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">수정</Button>
                      </Link>
                      {product.buyers.length > 0 && (
                        <span className="rounded-full bg-purple-900 px-2 py-0.5 text-xs text-purple-300">
                          {product.buyers.length}명
                        </span>
                      )}
                    </div>
                  </div>
                  {product.buyers.length > 0 && (
                    <div className="divide-y divide-slate-800">
                      {product.buyers.map((buyer) => (
                        <BuyerRow key={buyer.id} buyer={buyer} isSold={product.status === 'sold'} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 패널 1: 내 구매 희망 */}
      {tab === 1 && (
        <div>
          {myIntents.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="mb-4 text-slate-500">구매 희망 상품이 없습니다.</p>
              <Link href="/shop/products" className="text-sm text-emerald-500 hover:text-emerald-400">
                쇼핑 계속하기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myIntents.map((intent) => (
                <MyIntentRow key={intent.id} intent={intent} onCancel={handleCancelMyIntent} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 패널 2: 구매이력 */}
      {tab === 2 && (
        <div>
          {purchaseHistory.length === 0 ? (
            <p className="py-10 text-center text-slate-500">구매한 상품이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {purchaseHistory.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                    ) : (
                      <NoImagePlaceholder />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{item.title}</p>
                    <p className="text-sm text-slate-400">{Number(item.price).toLocaleString()}원</p>
                    <p className="mt-1 text-xs text-slate-600">{item.confirmedAt.slice(0, 10).replace(/-/g, '.')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
