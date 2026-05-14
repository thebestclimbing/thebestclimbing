# 구매 희망 기능 구현 설계

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** BestShop에 결제 없이 구매 희망(의향)을 등록하는 기능을 추가한다. 구매자는 상품별로 구매 희망을 등록·취소·메모 입력할 수 있고, 판매자와 관리자는 상품별 구매 희망자 목록을 조회할 수 있다.

**Architecture:** `purchase_intents` 전용 테이블 + Server Actions + RSC. 상품 상세 하단 "구매" 버튼은 Client Component, 내 구매 희망 목록 페이지는 RSC로 렌더링한다.

**Tech Stack:** Next.js 16 App Router, Supabase (server client + RLS), Tailwind CSS v4, Server Actions

---

## DB 스키마

```sql
create table purchase_intents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  product_id  uuid references products(id) on delete cascade not null,
  memo        text,
  created_at  timestamptz default now(),
  unique(user_id, product_id)
);

alter table purchase_intents enable row level security;

-- 구매자: 본인 행만 관리
create policy "buyers manage own intents" on purchase_intents
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 판매자: 자기 상품에 달린 intent만 조회
create policy "sellers view product intents" on purchase_intents
  for select using (
    exists (
      select 1 from products
      where id = product_id and seller_id = auth.uid()
    )
  );

-- admin: 전체 조회
create policy "admin view all intents" on purchase_intents
  for select using (public.is_admin());
```

- `UNIQUE(user_id, product_id)`: 같은 상품 중복 등록 방지
- `ON DELETE CASCADE`: 상품 삭제 시 구매 희망도 자동 삭제
- `memo`: nullable, 구매자가 판매자에게 전달할 메모

---

## 파일 구조

### 신규 생성
| 파일 | 역할 |
|------|------|
| `src/app/shop/intents/page.tsx` | 내 구매 희망 목록 (RSC, 로그인 필수) |
| `src/components/shop/purchase-intent-button.tsx` | 상품 상세 "구매" 버튼 (Client Component) |

### 수정
| 파일 | 변경 내용 |
|------|-----------|
| `src/app/shop/actions.ts` | `addPurchaseIntent`, `removePurchaseIntent`, `updateIntentMemo` 추가 |
| `src/app/shop/[id]/page.tsx` | 하단 고정 바에 PurchaseIntentButton 추가 (AddToCartButton 위) |
| `src/app/shop/admin/page.tsx` | 상품별 구매 희망자 목록 섹션 추가 |
| `src/app/shop/seller/page.tsx` | 내 상품별 구매 희망자 목록 섹션 추가 |
| `src/components/shop/shop-navbar.tsx` | 모바일 드로어에 "내 구매 희망" 링크 추가 |

---

## Server Actions (`src/app/shop/actions.ts` 추가)

```ts
// addPurchaseIntent(productId: string): Promise<{ error: string | null }>
// - auth.getUser()로 로그인 확인, 미로그인 시 { error: 'unauthenticated' }
// - insert into purchase_intents (user_id, product_id)
// - 이미 존재하면 conflict 무시 (do nothing)
// - revalidatePath('/shop/intents')

// removePurchaseIntent(intentId: string): Promise<{ error: string | null }>
// - delete from purchase_intents where id = intentId and user_id = auth.uid()
// - revalidatePath('/shop/intents')

// updateIntentMemo(intentId: string, memo: string): Promise<{ error: string | null }>
// - update purchase_intents set memo = memo where id = intentId and user_id = auth.uid()
// - revalidatePath('/shop/intents')
```

---

## 컴포넌트 상세

### PurchaseIntentButton (`src/components/shop/purchase-intent-button.tsx`)
- Props: `productId: string`, `initialIntent: { id: string } | null`
- `initialIntent` null이면 "구매" 버튼 (emerald), 있으면 "구매중" (slate, 비활성)
- 클릭 시 `addPurchaseIntent(productId)` 호출
- 로딩 중 버튼 비활성
- 비로그인 시 `/login`으로 redirect
- 상품 상세 하단 고정 바에 AddToCartButton과 함께 표시 (구매 버튼이 위, 장바구니가 아래)

### 내 구매 희망 목록 (`src/app/shop/intents/page.tsx`)
- RSC: `createClient()`로 현재 사용자의 purchase_intents join products join product_images 조회
- 미로그인 시 `redirect('/login')`
- 빈 목록: "구매 희망 상품이 없습니다" + "쇼핑 계속하기 →"
- 각 항목: 썸네일(w-16 h-16) + 상품명 + 단가 + 메모 입력 form + 취소 버튼
- 메모 저장: form + `updateIntentMemo` Server Action
- 취소: form + `removePurchaseIntent` Server Action

### 관리자 화면 (`src/app/shop/admin/page.tsx` 수정)
- 기존 "전체 상품 관리" 아래에 "구매 희망 현황" 섹션 추가
- 상품별로 구매 희망자 이름 목록 표시 (구매자 수 뱃지)
- purchase_intents join profiles(name) join products(title) 조회

### 판매자 화면 (`src/app/shop/seller/page.tsx` 수정)
- 기존 판매자 대시보드에 "내 상품 구매 희망 현황" 섹션 추가
- 자기 상품에 등록된 구매 희망자 이름 + 메모 표시

---

## 데이터 흐름

```
[상품 상세 /shop/:id]
  PurchaseIntentButton 클릭
    → addPurchaseIntent Server Action
    → purchase_intents insert
    → revalidatePath('/shop/intents')
    → 버튼 상태 "구매중"으로 변경 (optimistic)

[내 구매 희망 /shop/intents]
  RSC fetch: purchase_intents + products + product_images
  메모 저장 form submit → updateIntentMemo → revalidatePath
  취소 form submit → removePurchaseIntent → revalidatePath

[관리자 /shop/admin]
  RSC fetch: purchase_intents join products(seller_id) join profiles(name)
  → 상품별 구매 희망자 목록 표시

[판매자 /shop/seller]
  RSC fetch: purchase_intents join products(seller_id=auth.uid()) join profiles(name)
  → 자기 상품의 구매 희망자 목록 표시
```

---

## 비로그인 처리
- `PurchaseIntentButton`: Server Action에서 user 없으면 `{ error: 'unauthenticated' }` 반환 → 클라이언트에서 `router.push('/login')`
- `/shop/intents`: RSC에서 `getUser()` 후 null이면 `redirect('/login')`

---

## 상품 상세 하단 고정 바 레이아웃
```
[구매] ← PurchaseIntentButton (전체 너비, emerald / slate when active)
[장바구니 담기] ← AddToCartButton (전체 너비, emerald)
```
두 버튼을 세로로 쌓되 하단 고정 바 높이를 조정한다.
