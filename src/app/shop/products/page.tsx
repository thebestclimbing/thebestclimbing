import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/shop/products/product-card'
import type { Product } from '@/lib/shop/types'

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    filter?: string
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { q, category, filter } = await searchParams
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('name')

  let query = supabase
    .from('products')
    .select(
      `id, seller_id, title, price, is_official, status, category_id, created_at,
       product_images (id, url, is_primary, sort_order),
       profiles (id, name, seller_status, is_admin),
       categories (id, name, slug)`
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (q) query = query.ilike('title', `%${q}%`)
  if (category) query = query.eq('categories.slug', category)
  if (filter === 'official') query = query.eq('is_official', true)
  if (filter === 'member') query = query.eq('is_official', false)

  const { data: products } = await query

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const vals = { q, category, filter, ...overrides }
    Object.entries(vals).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    const qs = params.toString()
    return `/shop/products${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 md:py-8">
      <h1 className="mb-4 text-xl font-bold text-white md:mb-6 md:text-2xl">상품 목록</h1>

      {/* 검색 */}
      <form method="GET" className="mb-5 md:mb-6">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="상품 검색..."
            className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
          />
          {category && (
            <input type="hidden" name="category" value={category} />
          )}
          {filter && <input type="hidden" name="filter" value={filter} />}
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            검색
          </button>
        </div>
      </form>

      {/* 카테고리 탭 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <a
          href={buildHref({ category: undefined })}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !category
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          전체
        </a>
        {categories?.map((cat) => (
          <a
            key={cat.id}
            href={buildHref({ category: cat.slug })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === cat.slug
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat.name}
          </a>
        ))}
      </div>

      {/* 판매자 타입 필터 */}
      <div className="mb-6 flex gap-2">
        <a
          href={buildHref({ filter: 'official' })}
          className={`rounded border px-3 py-1 text-xs font-medium transition-colors ${
            filter === 'official'
              ? 'border-blue-400 bg-blue-900 text-blue-300'
              : 'border-slate-700 text-slate-400 hover:border-slate-500'
          }`}
        >
          🏪 공식 스토어
        </a>
        <a
          href={buildHref({ filter: 'member' })}
          className={`rounded border px-3 py-1 text-xs font-medium transition-colors ${
            filter === 'member'
              ? 'border-emerald-400 bg-emerald-900 text-emerald-300'
              : 'border-slate-700 text-slate-400 hover:border-slate-500'
          }`}
        >
          🧗 회원 마켓
        </a>
      </div>

      {/* 상품 그리드 */}
      {!products || products.length === 0 ? (
        <div className="py-20 text-center text-slate-500">
          상품이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product as unknown as Product} />
          ))}
        </div>
      )}
    </div>
  )
}
