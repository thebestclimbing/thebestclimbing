import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminProductsView from '@/components/shop/admin-products-view'

const PAGE_SIZE = 20

export default async function ShopAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const search = params.search?.trim() ?? ''
  const status = params.status ?? ''

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  type ProductImage = { id: string; url: string; is_primary: boolean; sort_order: number }
  type RawProduct = {
    id: string; title: string; price: number; status: string; is_official: boolean
    product_images: ProductImage[] | null
    profiles: { name: string } | null
  }

  let query = supabase
    .from('products')
    .select('id, title, price, status, is_official, product_images(id, url, is_primary, sort_order), profiles(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) query = query.ilike('title', `%${search}%`)
  if (status) query = query.eq('status', status)

  const { data: allProducts, count } = await query

  const products = (allProducts ?? []).map((p) => {
    const raw = p as unknown as RawProduct
    const imgs = (raw.product_images ?? []).sort((a, b) => a.sort_order - b.sort_order)
    const primary = imgs.find((img) => img.is_primary) ?? imgs[0]
    return {
      id: raw.id,
      title: raw.title,
      price: raw.price,
      status: raw.status,
      is_official: raw.is_official ?? false,
      imageUrl: primary?.url ?? null,
      sellerName: raw.profiles?.name ?? null,
    }
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:py-8">
      <h1 className="mb-5 text-xl font-bold text-white md:mb-8 md:text-2xl">쇼핑몰 관리자</h1>
      <AdminProductsView
        products={products}
        totalCount={count ?? 0}
        pageSize={PAGE_SIZE}
        currentPage={page}
        currentSearch={search}
        currentStatus={status}
      />
    </div>
  )
}
