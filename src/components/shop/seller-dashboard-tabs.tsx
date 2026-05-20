'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutList, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ConfirmPurchaseButton from '@/components/shop/confirm-purchase-button'
import NoImagePlaceholder from '@/components/shop/no-image-placeholder'
import { updateIntentMemo, cancelPurchaseIntent, toggleProductStatus } from '@/app/shop/actions'

const PAGE_SIZE = 9

type MergedProduct = {
  id: string
  title: string
  price: number
  status: string
  stock: number
  imageUrl: string | null
  buyers: { id: string; name: string | null; memo: string | null; quantity: number }[]
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

function Pagination({
  page,
  total,
  pageSize,
  onPage,
  color = 'purple',
}: {
  page: number
  total: number
  pageSize: number
  onPage: (p: number) => void
  color?: 'purple' | 'blue' | 'emerald'
}) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  const pages: number[] = []
  for (let i = start; i <= end; i++) pages.push(i)

  const activeClass =
    color === 'purple' ? 'bg-purple-700' : color === 'blue' ? 'bg-blue-700' : 'bg-emerald-700'

  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="rounded px-2.5 py-1.5 text-sm text-slate-400 hover:bg-slate-800 disabled:opacity-30"
      >
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`rounded px-2.5 py-1.5 text-sm transition ${
            p === page ? `${activeClass} text-white` : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="rounded px-2.5 py-1.5 text-sm text-slate-400 hover:bg-slate-800 disabled:opacity-30"
      >
        ›
      </button>
    </div>
  )
}

function ViewToggle({
  view,
  onChange,
}: {
  view: 'list' | 'grid'
  onChange: (v: 'list' | 'grid') => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-700 p-1">
      <button
        onClick={() => onChange('list')}
        className={`rounded p-1.5 transition ${view === 'list' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        aria-label="목록 보기"
      >
        <LayoutList size={15} />
      </button>
      <button
        onClick={() => onChange('grid')}
        className={`rounded p-1.5 transition ${view === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        aria-label="타일 보기"
      >
        <LayoutGrid size={15} />
      </button>
    </div>
  )
}

function BuyerRow({
  buyer,
  isSold,
}: {
  buyer: { id: string; name: string | null; memo: string | null; quantity: number }
  isSold: boolean
}) {
  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-300">{buyer.name ?? '(이름 없음)'}</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{buyer.quantity}개</span>
        </div>
        {!isSold && <ConfirmPurchaseButton intentId={buyer.id} />}
      </div>
      <p className="mt-0.5 whitespace-pre-wrap pl-3 text-sm text-slate-400">{buyer.memo || '메모 없음'}</p>
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
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [pages, setPages] = useState([1, 1, 1])
  const [myIntents, setMyIntents] = useState(initialMyIntents)
  const [products, setProducts] = useState(mergedProducts)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const currentPage = pages[tab]
  const setCurrentPage = (p: number) => setPages((prev) => { const next = [...prev]; next[tab] = p; return next })

  const handleTabChange = (newTab: number) => {
    setTab(newTab)
    setPages([1, 1, 1])
  }

  const handleViewChange = (v: 'list' | 'grid') => {
    setView(v)
    setPages([1, 1, 1])
  }

  const handleCancelMyIntent = (productId: string) => {
    setMyIntents((prev) => prev.filter((i) => i.product.id !== productId))
  }

  const handleToggleStatus = async (productId: string) => {
    setTogglingId(productId)
    const result = await toggleProductStatus(productId)
    setTogglingId(null)
    if (!result.error && result.newStatus) {
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, status: result.newStatus! } : p))
    }
  }

  // paginated slices
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE
  const pagedProducts = products.slice(from, to)
  const pagedIntents = myIntents.slice(from, to)
  const pagedHistory = purchaseHistory.slice(from, to)

  return (
    <div>
      {/* 탭바 */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex">
          {[
            { label: '내 상품', count: products.length, color: 'purple' },
            { label: '구매중', count: myIntents.length, color: 'blue' },
            { label: '구매이력', count: purchaseHistory.length, color: 'emerald' },
          ].map(({ label, count, color }, i) => (
            <button
              key={i}
              onClick={() => handleTabChange(i)}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
                tab === i
                  ? `border-b-2 ${color === 'purple' ? 'border-purple-400 text-purple-400' : color === 'blue' ? 'border-blue-400 text-blue-400' : 'border-emerald-400 text-emerald-400'}`
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
              <span className="ml-1.5 rounded-full bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">{count}</span>
            </button>
          ))}
        </div>
        <div className="pb-1">
          <ViewToggle view={view} onChange={handleViewChange} />
        </div>
      </div>

      {/* 패널 0: 내 상품 */}
      {tab === 0 && (
        <div>
          {products.length === 0 ? (
            <p className="py-10 text-center text-slate-500">등록된 상품이 없습니다.</p>
          ) : view === 'list' ? (
            <div className="space-y-4">
              {pagedProducts.map((product) => (
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
                      <p className="text-xs text-slate-400">
                        {Number(product.price).toLocaleString()}원{product.status !== 'sold' && ` · 재고 ${product.stock}개`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {product.status === 'sold' || product.status === 'draft' ? (
                        <Badge
                          variant="outline"
                          className={product.status === 'draft' ? 'border-slate-600 text-slate-400' : 'border-blue-700 text-blue-400'}
                        >
                          {product.status === 'draft' ? '임시저장' : '판매완료'}
                        </Badge>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(product.id)}
                          disabled={togglingId === product.id}
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition disabled:opacity-50 ${
                            product.status === 'active'
                              ? 'border-emerald-700 text-emerald-400 hover:border-red-700 hover:text-red-400'
                              : 'border-red-800 text-red-400 hover:border-emerald-700 hover:text-emerald-400'
                          }`}
                        >
                          {togglingId === product.id ? '...' : product.status === 'active' ? '판매중' : '비활성'}
                        </button>
                      )}
                      {product.status !== 'sold' && (
                        <Link href={`/shop/seller/products/${product.id}/edit`}>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">수정</Button>
                        </Link>
                      )}
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
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pagedProducts.map((product) => (
                <div key={product.id} className="flex flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                  <div className="relative aspect-square w-full bg-slate-800">
                    {product.imageUrl ? (
                      <Image src={product.imageUrl} alt={product.title} fill className="object-cover" />
                    ) : (
                      <NoImagePlaceholder />
                    )}
                    {product.buyers.length > 0 && (
                      <span className="absolute right-1.5 top-1.5 rounded bg-purple-900 px-1.5 py-0.5 text-xs text-purple-300">
                        {product.buyers.length}명
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2.5">
                    <p className="line-clamp-2 text-xs font-medium leading-snug text-white">{product.title}</p>
                    <p className="text-xs text-slate-400">{Number(product.price).toLocaleString()}원{product.status !== 'sold' && ` · ${product.stock}개`}</p>
                    <div className="mt-auto flex items-center justify-between gap-1 pt-1">
                      {product.status === 'sold' || product.status === 'draft' ? (
                        <Badge variant="outline" className={`text-xs ${product.status === 'draft' ? 'border-slate-600 text-slate-400' : 'border-blue-700 text-blue-400'}`}>
                          {product.status === 'draft' ? '임시저장' : '판매완료'}
                        </Badge>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(product.id)}
                          disabled={togglingId === product.id}
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium transition disabled:opacity-50 ${
                            product.status === 'active'
                              ? 'border-emerald-700 text-emerald-400 hover:border-red-700 hover:text-red-400'
                              : 'border-red-800 text-red-400 hover:border-emerald-700 hover:text-emerald-400'
                          }`}
                        >
                          {togglingId === product.id ? '...' : product.status === 'active' ? '판매중' : '비활성'}
                        </button>
                      )}
                      {product.status !== 'sold' && (
                        <Link href={`/shop/seller/products/${product.id}/edit`} className="text-xs text-slate-500 hover:text-slate-300">수정</Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={currentPage} total={products.length} pageSize={PAGE_SIZE} onPage={setCurrentPage} color="purple" />
        </div>
      )}

      {/* 패널 1: 구매중 */}
      {tab === 1 && (
        <div>
          {myIntents.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="mb-4 text-slate-500">구매 희망 상품이 없습니다.</p>
              <Link href="/shop/products" className="text-sm text-emerald-500 hover:text-emerald-400">
                쇼핑 계속하기 →
              </Link>
            </div>
          ) : view === 'list' ? (
            <div className="space-y-3">
              {pagedIntents.map((intent) => (
                <MyIntentRow key={intent.id} intent={intent} onCancel={handleCancelMyIntent} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pagedIntents.map((intent) => (
                <div key={intent.id} className="flex flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                  <Link href={`/shop/${intent.product.id}`}>
                    <div className="relative aspect-square w-full bg-slate-800">
                      {intent.product.imageUrl ? (
                        <Image src={intent.product.imageUrl} alt={intent.product.title} fill className="object-cover" />
                      ) : (
                        <NoImagePlaceholder />
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col gap-1 p-2.5">
                    <Link href={`/shop/${intent.product.id}`}>
                      <p className="line-clamp-2 text-xs font-medium leading-snug text-white hover:text-emerald-400">{intent.product.title}</p>
                    </Link>
                    <p className="text-xs text-slate-400">{Number(intent.product.price).toLocaleString()}원</p>
                    <button
                      onClick={async () => {
                        await cancelPurchaseIntent(intent.product.id)
                        handleCancelMyIntent(intent.product.id)
                      }}
                      className="mt-auto rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 hover:text-red-300"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={currentPage} total={myIntents.length} pageSize={PAGE_SIZE} onPage={setCurrentPage} color="blue" />
        </div>
      )}

      {/* 패널 2: 구매이력 */}
      {tab === 2 && (
        <div>
          {purchaseHistory.length === 0 ? (
            <p className="py-10 text-center text-slate-500">구매한 상품이 없습니다.</p>
          ) : view === 'list' ? (
            <div className="space-y-3">
              {pagedHistory.map((item) => (
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
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pagedHistory.map((item) => (
                <div key={item.id} className="flex flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                  <div className="relative aspect-square w-full bg-slate-800">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                    ) : (
                      <NoImagePlaceholder />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2.5">
                    <p className="line-clamp-2 text-xs font-medium leading-snug text-white">{item.title}</p>
                    <p className="text-xs text-slate-400">{Number(item.price).toLocaleString()}원</p>
                    <p className="mt-auto pt-1 text-xs text-slate-600">{item.confirmedAt.slice(0, 10).replace(/-/g, '.')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={currentPage} total={purchaseHistory.length} pageSize={PAGE_SIZE} onPage={setCurrentPage} color="emerald" />
        </div>
      )}
    </div>
  )
}
