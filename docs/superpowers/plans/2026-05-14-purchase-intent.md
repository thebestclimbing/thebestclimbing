# 구매 희망 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 결제 없이 구매 희망(의향)을 등록하고 구매자·판매자·관리자가 각각 조회·관리할 수 있는 기능 구현

**Architecture:** `purchase_intents` 전용 테이블 + Server Actions + RSC. PurchaseIntentButton은 Client Component, 내 구매 희망 목록(`/shop/intents`)은 RSC.

**Tech Stack:** Next.js 16 App Router, Supabase (server client + RLS), Tailwind CSS v4, Server Actions

---

## 파일 구조

| 파일 | 변경 |
|------|------|
| `supabase/migrations/023_purchase_intents.sql` | 신규: purchase_intents 테이블 + RLS |
| `src/app/shop/actions.ts` | 수정: addPurchaseIntent, removePurchaseIntent, updateIntentMemo 추가 |
| `src/components/shop/purchase-intent-button.tsx` | 신규: "구매"/"구매중" Client Component |
| `src/app/shop/[id]/page.tsx` | 수정: PurchaseIntentButton 추가, 구매 희망 조회, spacer h-24→h-44 |
| `src/app/shop/intents/page.tsx` | 신규: 내 구매 희망 목록 RSC |
| `src/app/shop/admin/page.tsx` | 수정: 구매 희망 현황 섹션 추가 |
| `src/app/shop/seller/page.tsx` | 수정: 내 상품 구매 희망 현황 섹션 추가 |
| `src/components/shop/shop-navbar.tsx` | 수정: 모바일 드로어에 "내 구매 희망" 링크 추가 |

---

### Task 1: DB 마이그레이션

**Files:**
- Create: `supabase/migrations/023_purchase_intents.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

`supabase/migrations/023_purchase_intents.sql`:

```sql
create table if not exists purchase_intents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  product_id  uuid references public.products(id) on delete cascade not null,
  memo        text,
  created_at  timestamptz default now(),
  unique(user_id, product_id)
);

alter table purchase_intents enable row level security;

create policy "buyers manage own intents" on purchase_intents
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sellers view product intents" on purchase_intents
  for select using (
    exists (
      select 1 from public.products
      where id = product_id and seller_id = auth.uid()
    )
  );

create policy "admin view all intents" on purchase_intents
  for select using (public.is_admin());
```

`user_id`를 `auth.users` 대신 `public.profiles(id)`로 참조한다. 이렇게 해야 Supabase JS 클라이언트에서 `profiles(name)` 조인이 가능하다.

- [ ] **Step 2: Supabase MCP로 적용**

Supabase MCP `execute_sql` 도구로 위 SQL을 실행한다.

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/023_purchase_intents.sql
git commit -m "feat: purchase_intents 테이블 및 RLS 추가"
```

---

### Task 2: Server Actions 추가

**Files:**
- Modify: `src/app/shop/actions.ts`

- [ ] **Step 1: 세 함수를 파일 끝에 추가**

기존 cart 관련 함수는 수정하지 않는다. 아래 코드를 `src/app/shop/actions.ts` 파일 끝에 추가:

```ts
export async function addPurchaseIntent(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' as const }

  const { error } = await supabase
    .from('purchase_intents')
    .upsert(
      { user_id: user.id, product_id: productId },
      { onConflict: 'user_id,product_id', ignoreDuplicates: true }
    )
  if (error) return { error: error.message }

  revalidatePath('/shop/intents')
  return { error: null }
}

export async function removePurchaseIntent(intentId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' as const }

  const { error } = await supabase
    .from('purchase_intents')
    .delete()
    .eq('id', intentId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/shop/intents')
  return { error: null }
}

export async function updateIntentMemo(intentId: string, formData: FormData) {
  const memo = (formData.get('memo') as string) ?? ''
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' as const }

  const { error } = await supabase
    .from('purchase_intents')
    .update({ memo })
    .eq('id', intentId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/shop/intents')
  return { error: null }
}
```

`removePurchaseIntent`와 `updateIntentMemo`는 form `action` prop에 `.bind(null, intentId)`로 사용되기 때문에 두 번째 인자로 `FormData`를 받는다.

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "(error|Error|✓|Failed|compiled)" | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/shop/actions.ts
git commit -m "feat: purchase intent server actions 추가"
```

---

### Task 3: PurchaseIntentButton 컴포넌트

**Files:**
- Create: `src/components/shop/purchase-intent-button.tsx`

- [ ] **Step 1: 컴포넌트 생성**

AddToCartButton의 fixed bar 높이는 약 85px (border 1px + py-4 외부 32px + 버튼 py-4 32px + 텍스트 20px). PurchaseIntentButton은 `bottom-[85px]`에 위치해 그 위에 쌓인다.

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addPurchaseIntent } from '@/app/shop/actions'

interface Props {
  productId: string
  initialIntent: { id: string } | null
}

export default function PurchaseIntentButton({ productId, initialIntent }: Props) {
  const [hasIntent, setHasIntent] = useState(initialIntent !== null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    const result = await addPurchaseIntent(productId)
    setLoading(false)
    if (result?.error === 'unauthenticated') { router.push('/login'); return }
    if (result?.error) return
    setHasIntent(true)
  }

  return (
    <div className="fixed bottom-[85px] left-0 right-0 z-40 bg-slate-950 px-4 pb-2 pt-3">
      {hasIntent ? (
        <button
          disabled
          className="w-full rounded-xl bg-slate-700 py-4 text-sm font-semibold text-slate-400"
        >
          구매중
        </button>
      ) : (
        <button
          onClick={handleClick}
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70"
        >
          {loading ? '처리 중...' : '구매'}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "(error|Error|✓|Failed|compiled)" | head -20
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/shop/purchase-intent-button.tsx
git commit -m "feat: PurchaseIntentButton 컴포넌트 추가"
```

---

### Task 4: 상품 상세 페이지 연동

**Files:**
- Modify: `src/app/shop/[id]/page.tsx`

- [ ] **Step 1: 전체 파일 교체**

현재 파일의 변경 포인트:
1. `import PurchaseIntentButton` 추가
2. `supabase.auth.getUser()` 호출 + purchase_intents 조회 추가
3. `<div className="h-24" />` → `<div className="h-44" />`
4. `<PurchaseIntentButton>` 추가

```tsx
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { ProductImage } from '@/lib/shop/types'
import AddToCartButton from '@/components/shop/add-to-cart-button'
import PurchaseIntentButton from '@/components/shop/purchase-intent-button'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select(
      `*, product_images (id, url, is_primary, sort_order),
       profiles (id, name, seller_status, is_admin),
       categories (id, name, slug)`
    )
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!product) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  let intent: { id: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('purchase_intents')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', id)
      .maybeSingle()
    intent = data
  }

  const images = ((product.product_images as ProductImage[]) ?? []).sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const primaryImage = images.find((img) => img.is_primary) ?? images[0]

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
        {/* 이미지 */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-800">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={product.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl text-slate-600">
                🧗
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative h-16 w-16 overflow-hidden rounded bg-slate-800"
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            {product.is_official && (
              <Badge className="bg-blue-600 text-white">공식 스토어</Badge>
            )}
            {(product as any).categories && (
              <Badge variant="outline" className="border-slate-600 text-slate-400">
                {(product as any).categories.name}
              </Badge>
            )}
          </div>

          <h1 className="mb-3 text-2xl font-bold text-white">{product.title}</h1>
          <p className="mb-6 text-3xl font-bold text-emerald-400">
            {Number(product.price).toLocaleString()}원
          </p>

          {product.description && (
            <div className="border-t border-slate-800 pt-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                상품 설명
              </h3>
              <p className="whitespace-pre-wrap text-slate-300">{product.description}</p>
            </div>
          )}

          <div className="mt-6 border-t border-slate-800 pt-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              판매자
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-white">
                {(product as any).profiles?.name ?? '알 수 없음'}
              </span>
              {product.is_official && (
                <Badge variant="outline" className="border-blue-700 bg-blue-900 text-xs text-blue-300">
                  공식
                </Badge>
              )}
            </div>
          </div>

          <p className="mt-2 text-sm text-slate-500">재고: {product.stock}개</p>
          <div className="h-44" />
        </div>
      </div>

      <PurchaseIntentButton productId={product.id} initialIntent={intent} />
      <AddToCartButton productId={product.id} stock={product.stock} />
    </div>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "(error|Error|✓|Failed|compiled)" | head -20
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/shop/[id]/page.tsx
git commit -m "feat: 상품 상세 페이지에 구매 희망 버튼 연동"
```

---

### Task 5: 내 구매 희망 목록 페이지

**Files:**
- Create: `src/app/shop/intents/page.tsx`

- [ ] **Step 1: 페이지 생성**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { removePurchaseIntent, updateIntentMemo } from '@/app/shop/actions'
import type { ProductImage } from '@/lib/shop/types'

export default async function IntentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
            const product = (intent as any).products
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
                      action={updateIntentMemo.bind(null, intent.id)}
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
                    action={removePurchaseIntent.bind(null, intent.id)}
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
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "(error|Error|✓|Failed|compiled)" | head -20
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/shop/intents/page.tsx
git commit -m "feat: 내 구매 희망 목록 페이지 추가"
```

---

### Task 6: 관리자 페이지 업데이트

**Files:**
- Modify: `src/app/shop/admin/page.tsx`

- [ ] **Step 1: 전체 파일 교체**

`Promise.all`에 purchase_intents 쿼리 추가 + "구매 희망 현황" 섹션 추가:

```tsx
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
  const intentGroups = (allIntents ?? []).reduce<Record<string, IntentGroup>>((acc, intent) => {
    const product = (intent as any).products
    if (!product) return acc
    if (!acc[product.id]) acc[product.id] = { productTitle: product.title, buyers: [] }
    acc[product.id].buyers.push({ name: (intent as any).profiles?.name ?? null, memo: intent.memo })
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
                  {(product as any).profiles?.name} · {Number(product.price).toLocaleString()}원
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
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "(error|Error|✓|Failed|compiled)" | head -20
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/shop/admin/page.tsx
git commit -m "feat: 관리자 페이지에 구매 희망 현황 섹션 추가"
```

---

### Task 7: 판매자 페이지 업데이트

**Files:**
- Modify: `src/app/shop/seller/page.tsx`

- [ ] **Step 1: 전체 파일 교체**

```tsx
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
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "(error|Error|✓|Failed|compiled)" | head -20
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/shop/seller/page.tsx
git commit -m "feat: 판매자 대시보드에 구매 희망 현황 섹션 추가"
```

---

### Task 8: NavBar 업데이트

**Files:**
- Modify: `src/components/shop/shop-navbar.tsx`

- [ ] **Step 1: 모바일 드로어에 "내 구매 희망" 링크 추가**

현재 L149-154 (장바구니 링크) 바로 아래에 추가:

```tsx
{user && (
  <Link
    href="/shop/intents"
    className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-200 hover:bg-slate-800"
  >
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
    내 구매 희망
  </Link>
)}
```

삽입 위치: `shop-navbar.tsx`의 장바구니 `<Link href="/shop/cart" ...>` 블록 바로 아래, `<Link href="/shop/products" ...>` 블록 바로 위.

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "(error|Error|✓|Failed|compiled)" | head -20
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/shop/shop-navbar.tsx
git commit -m "feat: 모바일 드로어에 내 구매 희망 링크 추가"
```
