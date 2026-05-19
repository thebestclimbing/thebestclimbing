# 구매확정 프로세스 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 판매자가 구매 희망자 중 한 명을 구매확정하면 상품이 판매완료 처리되고, 구매자는 MYBOARD에서 구매이력을 조회할 수 있다.

**Architecture:** 새 `purchase_history` 테이블에 확정 시점의 상품 정보(title, price, image_url)를 스냅샷으로 저장한다. 확정 시 해당 상품의 모든 purchase_intents를 삭제하고 product.status를 'sold'로 변경한다. MYBOARD에 "구매이력" 탭을 추가해 buyer가 자신의 구매 기록을 조회한다.

**Tech Stack:** Next.js App Router, Supabase (server client + admin client), React useTransition, Tailwind CSS

---

## File Map

| 파일 | 역할 |
|------|------|
| `supabase/migrations/024_purchase_history.sql` | 새 테이블 생성 + RLS |
| `src/app/shop/actions.ts` | `confirmPurchase` 액션 추가 |
| `src/components/shop/confirm-purchase-button.tsx` | 구매확정 클라이언트 컴포넌트 (신규) |
| `src/components/shop/seller-dashboard-tabs.tsx` | BuyerRow 확정버튼, 판매완료 뱃지, 구매이력 탭 |
| `src/app/shop/seller/page.tsx` | purchase_history 쿼리 추가 + prop 전달 |

---

## Task 1: DB 마이그레이션

**Files:**
- Create: `supabase/migrations/024_purchase_history.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
create table if not exists purchase_history (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid references public.products(id) on delete set null,
  buyer_id     uuid references public.profiles(id) on delete cascade not null,
  seller_id    uuid references public.profiles(id) on delete cascade not null,
  title        text not null,
  price        integer not null,
  image_url    text,
  confirmed_at timestamptz default now()
);

alter table purchase_history enable row level security;

create policy "buyers view own history" on purchase_history
  for select using (auth.uid() = buyer_id);

create policy "sellers view own sales" on purchase_history
  for select using (auth.uid() = seller_id);
```

- [ ] **Step 2: Supabase SQL Editor에서 실행**

Supabase 대시보드 → SQL Editor → 위 SQL 붙여넣고 Run.
`purchase_history` 테이블이 생성되고 RLS 정책 2개가 추가된다.

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/024_purchase_history.sql
git commit -m "feat: purchase_history 테이블 추가"
```

---

## Task 2: `confirmPurchase` 서버 액션

**Files:**
- Modify: `src/app/shop/actions.ts`

- [ ] **Step 1: actions.ts 끝에 함수 추가**

파일 마지막 `updateIntentMemoAsSeller` 함수 뒤에 추가:

```typescript
export async function confirmPurchase(intentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' as const }

  const admin = createAdminClient()

  const { data: intent } = await admin
    .from('purchase_intents')
    .select('product_id, user_id')
    .eq('id', intentId)
    .single()
  if (!intent) return { error: 'not found' as const }

  const { data: product } = await admin
    .from('products')
    .select('id, title, price, seller_id, product_images(id, url, is_primary, sort_order)')
    .eq('id', intent.product_id)
    .single()
  if (!product) return { error: 'not found' as const }
  if (product.seller_id !== user.id) return { error: 'unauthorized' as const }

  type PImg = { id: string; url: string; is_primary: boolean; sort_order: number }
  const images = ((product.product_images as unknown as PImg[]) ?? []).sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const primaryImage = images.find((img) => img.is_primary) ?? images[0]

  const { error: historyError } = await admin
    .from('purchase_history')
    .insert({
      product_id: intent.product_id,
      buyer_id: intent.user_id,
      seller_id: user.id,
      title: product.title,
      price: product.price,
      image_url: primaryImage?.url ?? null,
    })
  if (historyError) return { error: historyError.message }

  const { error: deleteError } = await admin
    .from('purchase_intents')
    .delete()
    .eq('product_id', intent.product_id)
  if (deleteError) return { error: deleteError.message }

  const { error: updateError } = await admin
    .from('products')
    .update({ status: 'sold' })
    .eq('id', intent.product_id)
  if (updateError) return { error: updateError.message }

  revalidatePath('/shop/seller')
  return { error: null }
}
```

- [ ] **Step 2: 린트 확인**

```bash
npm run lint
```

Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/app/shop/actions.ts
git commit -m "feat: confirmPurchase 서버 액션 추가"
```

---

## Task 3: `ConfirmPurchaseButton` 컴포넌트

**Files:**
- Create: `src/components/shop/confirm-purchase-button.tsx`

- [ ] **Step 1: 파일 생성**

```typescript
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { confirmPurchase } from '@/app/shop/actions'

export default function ConfirmPurchaseButton({ intentId }: { intentId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = () => {
    if (!confirm('이 구매자로 구매를 확정할까요?')) return
    startTransition(async () => {
      const result = await confirmPurchase(intentId)
      if (!result.error) router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
    >
      {pending ? '처리중...' : '구매확정'}
    </button>
  )
}
```

- [ ] **Step 2: 린트 확인**

```bash
npm run lint
```

Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/components/shop/confirm-purchase-button.tsx
git commit -m "feat: ConfirmPurchaseButton 컴포넌트 추가"
```

---

## Task 4: `seller-dashboard-tabs.tsx` 업데이트

**Files:**
- Modify: `src/components/shop/seller-dashboard-tabs.tsx`

변경 내용:
1. `ConfirmPurchaseButton` import 추가
2. `PurchaseHistoryItem` 타입 추가
3. `Props` 에 `purchaseHistory` 추가
4. `BuyerRow`에 `isSold` prop 추가 + 확정 버튼 표시
5. 상태 뱃지에 `sold` 처리 추가
6. 탭 3번째 ("구매이력") 버튼 + 패널 추가
7. `SellerDashboardTabs` 함수 시그니처에 `purchaseHistory` 추가

- [ ] **Step 1: import 추가**

기존:
```typescript
import NoImagePlaceholder from '@/components/shop/no-image-placeholder'
```
→ 앞에 한 줄 추가:
```typescript
import ConfirmPurchaseButton from '@/components/shop/confirm-purchase-button'
import NoImagePlaceholder from '@/components/shop/no-image-placeholder'
```

- [ ] **Step 2: `PurchaseHistoryItem` 타입 및 `Props` 업데이트**

기존:
```typescript
interface Props {
  mergedProducts: MergedProduct[]
  myIntents: MyIntent[]
}
```
→ 교체:
```typescript
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
```

- [ ] **Step 3: `BuyerRow` 함수 교체**

기존:
```typescript
function BuyerRow({ buyer }: { buyer: { id: string; name: string | null; memo: string | null } }) {
  return (
    <div className="px-4 py-2.5">
      <span className="text-sm font-semibold text-slate-300">{buyer.name ?? '(이름 없음)'}</span>
      <p className="mt-0.5 pl-3 whitespace-pre-wrap text-sm text-slate-400">{buyer.memo || '메모 없음'}</p>
    </div>
  )
}
```
→ 교체:
```typescript
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
```

- [ ] **Step 4: `SellerDashboardTabs` 함수 시그니처 업데이트**

기존:
```typescript
export default function SellerDashboardTabs({ mergedProducts, myIntents: initialMyIntents }: Props) {
```
→ 교체:
```typescript
export default function SellerDashboardTabs({ mergedProducts, myIntents: initialMyIntents, purchaseHistory }: Props) {
```

- [ ] **Step 5: 구매이력 탭 버튼 추가**

기존 탭 버튼 블록 끝 (`</div>` 앞):
```typescript
      {/* 기존 tab=1 버튼 */}
      <button
        onClick={() => setTab(1)}
        ...
      >
        구매중
        ...
      </button>
    </div>  {/* ← 이 닫힘 태그 앞에 추가 */}
```

탭 1 버튼 바로 뒤, `</div>` 앞에 삽입:
```typescript
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
```

- [ ] **Step 6: 상태 뱃지에 `sold` 추가**

기존:
```typescript
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
```
→ 교체:
```typescript
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
```

- [ ] **Step 7: `BuyerRow` 호출에 `isSold` prop 추가**

기존:
```typescript
                      {product.buyers.map((buyer) => (
                        <BuyerRow key={buyer.id} buyer={buyer} />
                      ))}
```
→ 교체:
```typescript
                      {product.buyers.map((buyer) => (
                        <BuyerRow key={buyer.id} buyer={buyer} isSold={product.status === 'sold'} />
                      ))}
```

- [ ] **Step 8: 구매이력 패널 추가 (패널 1 뒤)**

기존 패널 1 `})}` 블록이 끝나는 곳 바로 뒤에 추가:
```typescript
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
```

- [ ] **Step 9: 린트 확인**

```bash
npm run lint
```

Expected: 에러 없음.

- [ ] **Step 10: 커밋**

```bash
git add src/components/shop/seller-dashboard-tabs.tsx
git commit -m "feat: MYBOARD에 구매확정 버튼 및 구매이력 탭 추가"
```

---

## Task 5: `seller/page.tsx` 업데이트

**Files:**
- Modify: `src/app/shop/seller/page.tsx`

- [ ] **Step 1: purchase_history 쿼리 추가**

기존 `myIntents` 관련 map 이후, `return (` 전에 삽입:

```typescript
  type PurchaseHistoryRow = {
    id: string
    title: string
    price: number
    image_url: string | null
    confirmed_at: string
    product_id: string | null
  }
  const { data: purchaseHistoryRaw } = await supabase
    .from('purchase_history')
    .select('id, title, price, image_url, confirmed_at, product_id')
    .eq('buyer_id', user.id)
    .order('confirmed_at', { ascending: false })

  const purchaseHistory = ((purchaseHistoryRaw ?? []) as unknown as PurchaseHistoryRow[]).map((h) => ({
    id: h.id,
    title: h.title,
    price: h.price,
    imageUrl: h.image_url,
    confirmedAt: h.confirmed_at,
    productId: h.product_id,
  }))
```

- [ ] **Step 2: `SellerDashboardTabs` prop 추가**

기존:
```typescript
      <SellerDashboardTabs
        mergedProducts={mergedProducts}
        myIntents={myIntents}
      />
```
→ 교체:
```typescript
      <SellerDashboardTabs
        mergedProducts={mergedProducts}
        myIntents={myIntents}
        purchaseHistory={purchaseHistory}
      />
```

- [ ] **Step 3: 린트 + 빌드 확인**

```bash
npm run lint && npm run build 2>&1 | tail -20
```

Expected: 에러 없음, 빌드 성공.

- [ ] **Step 4: 커밋**

```bash
git add src/app/shop/seller/page.tsx
git commit -m "feat: MYBOARD에 구매이력 데이터 연결"
```

---

## 수동 검증 체크리스트

- [ ] 판매자 로그인 → MYBOARD → 내 상품 탭에서 구매 희망자 행마다 "구매확정" 버튼 표시
- [ ] "구매확정" 클릭 → confirm 다이얼로그 → 확인 → 상품 뱃지가 "판매완료"로 변경, 구매자 목록 사라짐
- [ ] 판매완료된 상품에는 "구매확정" 버튼 없음
- [ ] 구매자 로그인 → MYBOARD → "구매이력" 탭 표시, 구매한 상품이 목록에 나타남
- [ ] 상품 없을 때 "구매한 상품이 없습니다." 메시지 표시
