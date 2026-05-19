import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Badge } from '@/components/ui/badge'

async function updateSellerStatus(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return
  const userId = formData.get('userId') as string
  const newStatus = formData.get('newStatus') as string
  await supabase.from('profiles').update({ seller_status: newStatus }).eq('id', userId)
  revalidatePath('/shop/admin')
}

async function deactivateProduct(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return
  const productId = formData.get('productId') as string
  await supabase.from('products').update({ status: 'inactive' }).eq('id', productId)
  revalidatePath('/shop/admin')
}

export default async function ShopAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const [{ data: pendingSellers }, { data: allProducts }, { data: allIntents }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, seller_status, created_at')
      .in('seller_status', ['pending', 'rejected'])
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, title, price, status, is_official, profiles(name)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('purchase_intents')
      .select('id, memo, created_at, profiles(name), products(id, title)')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  type IntentGroup = { productTitle: string; buyers: { name: string | null; memo: string | null }[] }
  type IntentRow = { products: { id: string; title: string } | null; profiles: { name: string } | null }
  const intentGroups = (allIntents ?? []).reduce<Record<string, IntentGroup>>((acc, intent) => {
    const row = intent as unknown as IntentRow
    const product = row.products
    if (!product) return acc
    if (!acc[product.id]) acc[product.id] = { productTitle: product.title, buyers: [] }
    acc[product.id].buyers.push({ name: row.profiles?.name ?? null, memo: intent.memo })
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:py-8">
      <h1 className="mb-5 text-xl font-bold text-white md:mb-8 md:text-2xl">쇼핑몰 관리자</h1>

      {/* 판매자 신청 관리 */}
      <section className="mb-10">
        <h2 className="mb-4 border-l-4 border-blue-400 pl-3 text-lg font-semibold text-blue-400">
          판매자 신청 관리
        </h2>
        {!pendingSellers || pendingSellers.length === 0 ? (
          <p className="text-sm text-slate-500">대기 중인 신청이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {pendingSellers.map((seller) => (
              <div
                key={seller.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white">{seller.name ?? '이름 없음'}</p>
                  <p className="truncate text-xs text-slate-500">{seller.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      seller.seller_status === 'pending'
                        ? 'border-yellow-600 text-yellow-400'
                        : 'border-red-700 text-red-400'
                    }
                  >
                    {seller.seller_status === 'pending' ? '대기 중' : '거절됨'}
                  </Badge>
                  <form action={updateSellerStatus}>
                    <input type="hidden" name="userId" value={seller.id} />
                    <input type="hidden" name="newStatus" value="approved" />
                    <button type="submit" className="rounded bg-emerald-700 px-3 py-1 text-xs text-white hover:bg-emerald-600">승인</button>
                  </form>
                  {seller.seller_status === 'pending' && (
                    <form action={updateSellerStatus}>
                      <input type="hidden" name="userId" value={seller.id} />
                      <input type="hidden" name="newStatus" value="rejected" />
                      <button type="submit" className="rounded bg-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-600">거절</button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 전체 상품 관리 */}
      <section className="mb-10">
        <h2 className="mb-4 border-l-4 border-emerald-400 pl-3 text-lg font-semibold text-emerald-400">
          전체 상품 관리
        </h2>
        <div className="space-y-2">
          {(allProducts ?? []).map((product) => (
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
                  {(product as unknown as { profiles: { name: string } | null }).profiles?.name} · {Number(product.price).toLocaleString()}원
                </p>
              </div>
              <div className="flex items-center gap-2">
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
                {product.status !== 'inactive' && (
                  <form action={deactivateProduct}>
                    <input type="hidden" name="productId" value={product.id} />
                    <button type="submit" className="rounded bg-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-red-800 hover:text-white">비활성화</button>
                  </form>
                )}
              </div>
            </div>
          ))}
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
