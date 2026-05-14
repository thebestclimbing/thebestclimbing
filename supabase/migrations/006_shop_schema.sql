-- profiles에 shop 관련 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS seller_status text NOT NULL DEFAULT 'none'
    CHECK (seller_status IN ('none', 'pending', 'approved', 'rejected'));

-- is_admin 컬럼: role='admin'에서 자동 파생 (generated column)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean GENERATED ALWAYS AS (role = 'admin') STORED;

-- categories 테이블
CREATE TABLE IF NOT EXISTS public.categories (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name      text   NOT NULL,
  slug      text   NOT NULL UNIQUE,
  parent_id bigint REFERENCES public.categories(id)
);

-- 기본 카테고리 seed
INSERT INTO public.categories (name, slug) VALUES
  ('신발', 'shoes'),
  ('장갑', 'gloves'),
  ('로프', 'rope'),
  ('핑거보드', 'fingerboard'),
  ('의류', 'clothing'),
  ('기타 장비', 'equipment')
ON CONFLICT (slug) DO NOTHING;

-- products 테이블
CREATE TABLE IF NOT EXISTS public.products (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text    NOT NULL,
  description text,
  price       numeric(10, 0) NOT NULL,
  category_id bigint  REFERENCES public.categories(id),
  status      text    NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'active', 'inactive')),
  is_official boolean NOT NULL DEFAULT false,
  stock       integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- product_images 테이블
CREATE TABLE IF NOT EXISTS public.product_images (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url        text    NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products (seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (status);

-- RLS 활성화
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- categories RLS
CREATE POLICY "categories: 전체 읽기" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "categories: admin 쓰기" ON public.categories
  FOR ALL USING (public.is_admin());

-- products RLS
CREATE POLICY "products: active 전체 공개" ON public.products
  FOR SELECT USING (status = 'active');

CREATE POLICY "products: 본인 상품 조회" ON public.products
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "products: admin 전체 조회" ON public.products
  FOR SELECT USING (public.is_admin());

CREATE POLICY "products: 판매자 등록" ON public.products
  FOR INSERT WITH CHECK (
    seller_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (seller_status = 'approved' OR role = 'admin')
    )
  );

CREATE POLICY "products: 본인 상품 수정" ON public.products
  FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "products: admin 수정" ON public.products
  FOR UPDATE USING (public.is_admin());

-- product_images RLS
CREATE POLICY "product_images: 전체 읽기" ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "product_images: 본인 상품 이미지 관리" ON public.product_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_id AND seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_id AND seller_id = auth.uid()
    )
  );

-- Storage 버킷 (Supabase Dashboard > Storage에서도 만들 수 있음)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product-images: 공개 읽기" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product-images: 로그인 사용자 업로드" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);
