import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { removePurchaseIntent, updateIntentMemo } from '@/app/shop/actions'
import type { ProductImage } from '@/lib/shop/types'

async function removeIntent(intentId: string): Promise<void> {
  'use server'
  await removePurchaseIntent(intentId)
}

async function updateMemo(intentId: string, formData: FormData): Promise<void> {
  'use server'
  await updateIntentMemo(intentId, formData)
}

export default async function IntentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/shop/intents')

  const { data: intents } = await supabase
    .from('purchase_intents')
    .select(`
      id, memo, created_at,
      products (
        id, title, price,
        product_images (id, url, is_primary, sort_order)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:py-8">
      <h1 className="mb-5 text-xl font-bold text-white">내 구매 희망</h1>

      {!intents || intents.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="mb-4 text-slate-500">구매 희망 상품이 없습니다.</p>
          <Link href="/shop/products" className="text-sm text-emerald-500 hover:text-emerald-400">
            쇼핑 계속하기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {intents.map((intent) => {
            type IntentRow = { products: { id: string; title: string; price: number; product_images: ProductImage[] } | null }
            const product = (intent as unknown as IntentRow).products
            if (!product) return null
            const images = ((product.product_images as ProductImage[]) ?? []).sort(
              (a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order
            )
            const primaryImage = images.find((img: ProductImage) => img.is_primary) ?? images[0]

            return (
              <div key={intent.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex gap-4">
                  <Link href={`/shop/${product.id}`} className="flex-shrink-0">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-slate-800">
                      {primaryImage ? (
                        <Image
                          src={primaryImage.url}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl text-slate-600">
                          🧗
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link href={`/shop/${product.id}`}>
                      <p className="truncate font-medium text-white hover:text-emerald-400">
                        {product.title}
                      </p>
                    </Link>
                    <p className="mb-2 text-sm text-slate-400">
                      {Number(product.price).toLocaleString()}원
                    </p>

                    <form
                      action={updateMemo.bind(null, intent.id)}
                      className="flex items-center gap-2"
                    >
                      <input
                        name="memo"
                        defaultValue={intent.memo ?? ''}
                        placeholder="판매자에게 메모..."
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-emerald-700 hover:text-emerald-400"
                      >
                        저장
                      </button>
                    </form>
                  </div>

                  <form
                    action={removeIntent.bind(null, intent.id)}
                    className="flex-shrink-0 self-start"
                  >
                    <button
                      type="submit"
                      className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 hover:text-red-300"
                    >
                      취소
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
