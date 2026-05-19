import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProductSlider from '@/components/shop/product-slider'
import ShopSearch from '@/components/shop/shop-search'

type RawProduct = { id: string; title: string; price: number; product_images: { id: string; url: string; is_primary: boolean; sort_order: number }[] | null }

function toSlides(rawProducts: RawProduct[]) {
  return rawProducts.map((p) => {
    const images = (p.product_images ?? []).sort(
      (a, b) => a.sort_order - b.sort_order
    )
    const primary = images.find((img) => img.is_primary) ?? images[0]
    return { id: p.id, title: p.title, price: p.price, imageUrl: primary?.url ?? null }
  })
}

export default async function ShopMainPage() {
  const supabase = await createClient()

  const [{ data: centerRaw }, { data: memberRaw }] = await Promise.all([
    supabase
      .from('products')
      .select('id, title, price, product_images(id, url, is_primary, sort_order)')
      .eq('status', 'active')
      .eq('is_official', true)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('products')
      .select('id, title, price, product_images(id, url, is_primary, sort_order)')
      .eq('status', 'active')
      .eq('is_official', false)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const centerProducts = toSlides(centerRaw ?? [])
  const memberProducts = toSlides(memberRaw ?? [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-3">
      <ShopSearch />

      {/* CENTER */}
      <section className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">CENTER</h2>
          <Link href="/shop/products?filter=official" className="text-xs text-slate-600 hover:text-slate-400">
            전체보기 →
          </Link>
        </div>
        <ProductSlider products={centerProducts} />
      </section>

      {/* MEMBER */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">MEMBER</h2>
          <Link href="/shop/products?filter=member" className="text-xs text-slate-600 hover:text-slate-400">
            전체보기 →
          </Link>
        </div>
        <ProductSlider products={memberProducts} />
      </section>
    </div>
  )
}
