import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function SellerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('seller_status, is_admin')
    .eq('id', user.id)
    .single()

  if (profile?.seller_status !== 'approved' && !profile?.is_admin) {
    redirect('/shop/seller/apply')
  }

  const [{ data: products }, { data: intents }] = await Promise.all([
    supabase
      .from('products')
      .select('id, title, price, status, is_official, created_at')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('purchase_intents')
      .select('id, memo, created_at, profiles(name), products(id, title)')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  type IntentGroup = { productTitle: string; buyers: { name: string | null; memo: string | null }[] }
  const intentGroups = (intents ?? []).reduce<Record<string, IntentGroup>>((acc, intent) => {
    const product = (intent as any).products
    if (!product) return acc
    if (!acc[product.id]) acc[product.id] = { productTitle: product.title, buyers: [] }
    acc[product.id].buyers.push({ name: (intent as any).profiles?.name ?? null, memo: intent.memo })
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:py-8">
      <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-white md:text-2xl">판매자 대시보드</h1>
        <Link href="/shop/seller/products/new">
          <Button className="w-full sm:w-auto">+ 새 상품 등록</Button>
        </Link>
      </div>

      {/* 내 상품 목록 */}
      <section className="mb-10">
        <div className="space-y-2">
          {!products || products.length === 0 ? (
            <p className="py-10 text-center text-slate-500">등록된 상품이 없습니다.</p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{product.title}</p>
                  <p className="text-sm text-slate-400">{Number(product.price).toLocaleString()}원</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={
                      product.status === 'active'
                        ? 'border-emerald-700 text-emerald-400'
                        : product.status === 'draft'
                        ? 'border-slate-600 text-slate-400'
                        : 'border-red-700 text-red-400'
                    }
                  >
                    {product.status === 'active' ? '판매중' : product.status === 'draft' ? '임시저장' : '비활성'}
                  </Badge>
                  <Link href={`/shop/seller/products/${product.id}/edit`}>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">수정</Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 구매 희망 현황 */}
      <section>
        <h2 className="mb-4 border-l-4 border-purple-400 pl-3 text-lg font-semibold text-purple-400">
          구매 희망 현황
        </h2>
        {Object.keys(intentGroups).length === 0 ? (
          <p className="text-sm text-slate-500">구매 희망 내역이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {Object.values(intentGroups).map((group, i) => (
              <div key={i} className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <p className="font-medium text-white">{group.productTitle}</p>
                  <span className="rounded-full bg-purple-900 px-2 py-0.5 text-xs text-purple-300">
                    {group.buyers.length}명
                  </span>
                </div>
                <div className="space-y-1">
                  {group.buyers.map((buyer, j) => (
                    <div key={j} className="flex gap-2 text-sm">
                      <span className="text-slate-300">{buyer.name ?? '이름 없음'}</span>
                      {buyer.memo && <span className="text-slate-500">· {buyer.memo}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
