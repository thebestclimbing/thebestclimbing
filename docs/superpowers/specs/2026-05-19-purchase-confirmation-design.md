# 구매확정 프로세스 설계

Date: 2026-05-19

## 개요

판매자가 구매 희망자 중 한 명을 선택해 구매를 확정하면 상품이 판매완료로 전환되고, 구매자는 MYBOARD에서 구매이력을 조회할 수 있다.

---

## DB 변경

### 새 테이블: `purchase_history`

```sql
create table purchase_history (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid references products(id) on delete set null,
  buyer_id     uuid references profiles(id) on delete cascade not null,
  seller_id    uuid references profiles(id) on delete cascade not null,
  title        text not null,
  price        integer not null,
  image_url    text,
  confirmed_at timestamptz default now()
);
```

- `product_id`: 상품 삭제 시 NULL 처리 (이력은 보존)
- `title`, `price`, `image_url`: 확정 시점 스냅샷 (상품 수정·삭제 후에도 이력 표시 가능)

**RLS:**
- 구매자: `buyer_id = auth.uid()` 인 row SELECT 가능
- 판매자: `seller_id = auth.uid()` 인 row SELECT 가능

### `products` status 값 추가

기존: `active` / `draft` / 그 외  
추가: `sold` — 판매완료 상태

---

## 서버 액션

### `confirmPurchase(intentId: string)`

위치: `src/app/shop/actions.ts`

흐름:
1. 로그인 확인
2. `purchase_intents` 에서 `intentId` 조회 → `product_id`, `buyer_id` 확보
3. `products` 에서 해당 product 조회 → 호출자(`user.id`)가 `seller_id`인지 검증
4. product에서 `title`, `price` 확보. `product_images` join → `sort_order` 오름차순 정렬 후 `is_primary=true` 또는 첫 번째 이미지의 `url`을 `image_url`로 사용
5. 다음을 순서대로 실행:
   - `purchase_history` insert
   - `purchase_intents` DELETE WHERE `product_id = product_id` (전체 삭제)
   - `products` UPDATE SET `status = 'sold'` WHERE `id = product_id`
6. `revalidatePath('/shop/seller')` 호출

오류 조건:
- 미인증 → `{ error: 'unauthenticated' }`
- 판매자 불일치 → `{ error: 'unauthorized' }`
- intent/product 없음 → `{ error: 'not found' }`

---

## UI 변경

### MYBOARD "내 상품" 탭

**BuyerRow 변경:**
- 각 구매자 행 오른쪽에 "구매확정" 버튼 추가
- 클릭 시 `confirmPurchase(intent.id)` 호출
- 확정 성공 후: `router.refresh()` 로 서버 데이터 재조회 (상품 상태·구매자 목록 자동 갱신)

**상품 카드 뱃지:**
- `active` → "판매중" (emerald)
- `draft` → "임시저장" (slate)
- `sold` → "판매완료" (blue)
- 그 외 → "비활성" (red)

### MYBOARD "구매이력" 탭 (신규, 3번째 탭)

**데이터 소스:** `purchase_history WHERE buyer_id = user_id ORDER BY confirmed_at DESC`

**표시 항목 (행별):**
- 썸네일 (`image_url` 스냅샷, 없으면 `NoImagePlaceholder`)
- 상품명 (`title` 스냅샷)
- 가격 (`price` 스냅샷, `toLocaleString()원`)
- 구매일 (`confirmed_at`, `YYYY.MM.DD` 형식)

**빈 상태:** "구매한 상품이 없습니다."

**데이터 흐름:**
- `src/app/shop/seller/page.tsx`에서 `purchase_history` 쿼리 추가
- `SellerDashboardTabs`에 `purchaseHistory` prop으로 전달

---

## 파일 변경 범위

| 파일 | 변경 내용 |
|------|-----------|
| `supabase/migrations/024_purchase_history.sql` | 신규 테이블 + RLS |
| `src/app/shop/actions.ts` | `confirmPurchase` 액션 추가 |
| `src/app/shop/seller/page.tsx` | `purchase_history` 쿼리 추가, props 확장 |
| `src/components/shop/seller-dashboard-tabs.tsx` | BuyerRow 확정 버튼, 판매완료 뱃지, 구매이력 탭 추가 |
| `src/components/shop/confirm-purchase-button.tsx` | 신규 클라이언트 컴포넌트 |

---

## 범위 외 (이번 구현 제외)

- 구매 확정 알림(push/email)
- 판매자의 판매이력 탭
- 구매 취소/환불 프로세스
