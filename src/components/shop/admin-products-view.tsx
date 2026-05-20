'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LayoutList, LayoutGrid, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import NoImagePlaceholder from '@/components/shop/no-image-placeholder'
import { adminDeactivateProduct } from '@/app/shop/actions'

type Product = {
  id: string
  title: string
  price: number
  status: string
  is_official: boolean
  imageUrl: string | null
  sellerName: string | null
}

interface Props {
  products: Product[]
  totalCount: number
  pageSize: number
  currentPage: number
  currentSearch: string
  currentStatus: string
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={
        status === 'active'
          ? 'border-emerald-700 text-emerald-400'
          : status === 'draft'
          ? 'border-slate-600 text-slate-400'
          : status === 'sold'
          ? 'border-blue-700 text-blue-400'
          : 'border-red-700 text-red-400'
      }
    >
      {status === 'active' ? '판매중' : status === 'draft' ? '임시저장' : status === 'sold' ? '판매완료' : '비활성'}
    </Badge>
  )
}

function SearchBar({
  currentSearch,
  currentStatus,
}: {
  currentSearch: string
  currentStatus: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState(currentSearch)
  const [status, setStatus] = useState(currentStatus)

  const navigate = (s: string, st: string) => {
    const p = new URLSearchParams()
    if (s) p.set('search', s)
    if (st) p.set('status', st)
    p.set('page', '1')
    router.push(`/shop/admin?${p.toString()}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(search, status)
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    navigate(search, newStatus)
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap gap-2">
      <div className="relative min-w-0 flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="상품명 검색..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-8 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
      >
        <option value="">전체 상태</option>
        <option value="active">판매중</option>
        <option value="draft">임시저장</option>
        <option value="sold">판매완료</option>
        <option value="inactive">비활성</option>
      </select>
      <button
        type="submit"
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
      >
        검색
      </button>
    </form>
  )
}

function Pagination({
  currentPage,
  totalCount,
  pageSize,
  currentSearch,
  currentStatus,
}: {
  currentPage: number
  totalCount: number
  pageSize: number
  currentSearch: string
  currentStatus: string
}) {
  const router = useRouter()
  const totalPages = Math.ceil(totalCount / pageSize)

  if (totalPages <= 1) return null

  const goTo = (page: number) => {
    const p = new URLSearchParams()
    if (currentSearch) p.set('search', currentSearch)
    if (currentStatus) p.set('status', currentStatus)
    p.set('page', page.toString())
    router.push(`/shop/admin?${p.toString()}`)
  }

  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, start + 4)
  const pages: number[] = []
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded px-2.5 py-1.5 text-sm text-slate-400 hover:bg-slate-800 disabled:opacity-30"
      >
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => goTo(p)}
          className={`rounded px-2.5 py-1.5 text-sm transition ${
            p === currentPage ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded px-2.5 py-1.5 text-sm text-slate-400 hover:bg-slate-800 disabled:opacity-30"
      >
        ›
      </button>
    </div>
  )
}

export default function AdminProductsView({
  products,
  totalCount,
  pageSize,
  currentPage,
  currentSearch,
  currentStatus,
}: Props) {
  const [view, setView] = useState<'list' | 'grid'>('list')

  return (
    <div>
      <SearchBar currentSearch={currentSearch} currentStatus={currentStatus} />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="border-l-4 border-emerald-400 pl-3 text-lg font-semibold text-emerald-400">
          전체 상품 관리
          <span className="ml-2 text-sm font-normal text-slate-500">{totalCount}개</span>
        </h2>
        <div className="flex items-center gap-1 rounded-lg border border-slate-700 p-1">
          <button
            onClick={() => setView('list')}
            className={`rounded p-1.5 transition ${view === 'list' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            aria-label="목록 보기"
          >
            <LayoutList size={16} />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`rounded p-1.5 transition ${view === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            aria-label="타일 보기"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="py-16 text-center text-slate-500">검색 결과가 없습니다.</p>
      ) : view === 'list' ? (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-white">{product.title}</p>
                  {product.is_official && (
                    <Badge variant="outline" className="border-blue-700 bg-blue-900 text-xs text-blue-300">공식</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {product.sellerName} · {Number(product.price).toLocaleString()}원
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={product.status} />
                {product.status !== 'inactive' && (
                  <form action={adminDeactivateProduct}>
                    <input type="hidden" name="productId" value={product.id} />
                    <button type="submit" className="rounded bg-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-red-800 hover:text-white">비활성화</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="relative aspect-square w-full bg-slate-800">
                {product.imageUrl ? (
                  <Image src={product.imageUrl} alt={product.title} fill className="object-cover" />
                ) : (
                  <NoImagePlaceholder />
                )}
                {product.is_official && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-blue-900 px-1.5 py-0.5 text-xs text-blue-300">공식</span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-2.5">
                <p className="line-clamp-2 text-xs font-medium leading-snug text-white">{product.title}</p>
                <p className="text-xs text-slate-500">{product.sellerName}</p>
                <p className="text-xs font-semibold text-slate-300">{Number(product.price).toLocaleString()}원</p>
                <div className="mt-auto flex items-center justify-between pt-1">
                  <StatusBadge status={product.status} />
                  {product.status !== 'inactive' && (
                    <form action={adminDeactivateProduct}>
                      <input type="hidden" name="productId" value={product.id} />
                      <button type="submit" className="rounded px-2 py-0.5 text-xs text-slate-500 hover:bg-red-800 hover:text-white">비활성화</button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={pageSize}
        currentSearch={currentSearch}
        currentStatus={currentStatus}
      />
    </div>
  )
}
