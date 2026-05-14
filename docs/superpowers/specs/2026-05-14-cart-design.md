# 장바구니 기능 구현 설계

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** BestShop에 로그인 사용자 전용 장바구니 기능을 추가한다 (담기/수량 변경/삭제/합계 확인). 결제/주문은 포함하지 않는다.

**Architecture:** Server Actions로 cart_items 테이블을 뮤테이션하고, 장바구니 페이지는 RSC로 렌더링한다. NavBar 뱃지와 "장바구니 담기" 버튼은 클라이언트 컴포넌트로 분리한다.

**Tech Stack:** Next.js 16 App Router, Supabase (server client + RLS), Tailwind CSS v4, Server Actions

---

## DB 스키마

```sql
create table cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  product_id  uuid references products(id) on delete cascade not null,
  quantity    int not null default 1 check (quantity > 0),
  created_at  timestamptz default now(),
  unique(user_id, product_id)
);

alter table cart_items enable row level security;

create policy "users manage own cart" on cart_items
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- `UNIQUE(user_id, product_id)`: 같은 상품 중복 담기 방지 → upsert로 수량 증가
- `ON DELETE CASCADE`: 상품 삭제 시 장바구니 항목도 자동 삭제
- RLS: 본인 행만 SELECT/INSERT/UPDATE/DELETE 가능

---

## 파일 구조

### 신규 생성
| 파일 | 역할 |
|------|------|
| `src/app/shop/actions.ts` | Server Actions: addToCart, removeFromCart, updateCartQuantity |
| `src/app/shop/cart/page.tsx` | 장바구니 페이지 (RSC, 로그인 필수) |
| `src/components/shop/add-to-cart-button.tsx` | 상품 상세 하단 담기 버튼 (Client Component) |
| `src/components/shop/cart-icon.tsx` | NavBar 장바구니 아이콘 + 뱃지 (Client Component) |

### 수정
| 파일 | 변경 내용 |
|------|-----------|
| `src/app/shop/[id]/page.tsx` | 하단 고정 바에 AddToCartButton 추가 |
| `src/components/shop/shop-navbar.tsx` | 데스크톱 우측 + 모바일 드로어에 CartIcon 추가 |

---

## Server Actions (`src/app/shop/actions.ts`)

```ts
'use server'

// addToCart(productId: string, quantity: number): Promise<void>
// - auth.getUser()로 로그인 확인, 미로그인 시 throw
// - upsert cart_items (on conflict user_id, product_id → quantity += quantity)

// removeFromCart(cartItemId: string): Promise<void>
// - delete from cart_items where id = cartItemId and user_id = auth.uid()

// updateCartQuantity(cartItemId: string, quantity: number): Promise<void>
// - quantity < 1이면 removeFromCart 호출
// - update cart_items set quantity = quantity where id = cartItemId and user_id = auth.uid()
```

모든 액션은 `revalidatePath('/shop/cart')`를 호출해 RSC 캐시를 갱신한다.

---

## 컴포넌트 상세

### AddToCartButton (`src/components/shop/add-to-cart-button.tsx`)
- Props: `productId: string`, `stock: number`
- 재고 0이면 "품절" 비활성 버튼
- 클릭 시 `addToCart(productId, 1)` 호출
- 로딩 중 버튼 비활성
- 성공 시 1.5초간 "담겼습니다 ✓" 표시 후 원상복귀
- 비로그인(Server Action에서 에러 반환) 시 `/login`으로 redirect

### CartIcon (`src/components/shop/cart-icon.tsx`)
- 마운트 시 Supabase client로 `cart_items` count 조회
- 뱃지: count > 0일 때만 표시, 최대 99+ 표기
- 클릭 시 `/shop/cart` 이동
- ShopNavbar의 데스크톱 우측 영역과 모바일 드로어 모두에 삽입

### 장바구니 페이지 (`src/app/shop/cart/page.tsx`)
- RSC: `createClient()`로 현재 사용자 cart_items join products join product_images 조회
- 미로그인 시 `redirect('/login')`
- 빈 장바구니: "장바구니가 비어있습니다" + "쇼핑 계속하기 →" 링크
- 각 항목: 썸네일(w-16 h-16) + 상품명 + 단가 + 수량 조절(- / +) + 삭제 버튼
- 수량 조절/삭제는 form + Server Action (버튼 type="submit")
- 하단: 총 금액 (항목별 price × quantity 합산) + "주문하기" 버튼 (disabled, placeholder)

---

## 데이터 흐름

```
[상품 상세 /shop/:id]
  AddToCartButton 클릭
    → addToCart Server Action
    → cart_items upsert
    → revalidatePath('/shop/cart')

[NavBar CartIcon]
  mount → supabase.from('cart_items').select('id', { count: 'exact', head: true })
        → 뱃지 count 표시

[장바구니 /shop/cart]
  RSC fetch: cart_items + products + product_images
    → 목록 렌더
  수량 변경/삭제 form submit
    → updateCartQuantity / removeFromCart Server Action
    → revalidatePath('/shop/cart')
    → RSC 재렌더
```

---

## 비로그인 처리
- `AddToCartButton`: Server Action에서 user 없으면 `{ error: 'unauthenticated' }` 반환 → 클라이언트에서 `router.push('/login')`
- `/shop/cart`: RSC에서 `getUser()` 후 null이면 `redirect('/login')`
- `CartIcon`: 비로그인 시 뱃지 0 (쿼리 결과 없음), 클릭 시 `/shop/cart` → redirect to login

---

## 주문하기 버튼
현재 스코프에서는 비활성(disabled) 상태로만 표시한다. 결제/주문 기능은 별도 스펙에서 구현한다.
