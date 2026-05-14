export type SellerStatus = 'none' | 'pending' | 'approved' | 'rejected'
export type ProductStatus = 'draft' | 'active' | 'inactive'

export interface Category {
  id: number
  name: string
  slug: string
  parent_id: number | null
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  sort_order: number
  is_primary: boolean
}

export interface Product {
  id: string
  seller_id: string
  title: string
  description: string | null
  price: number
  category_id: number | null
  status: ProductStatus
  is_official: boolean
  stock: number
  created_at: string
  updated_at: string
  categories?: Category | null
  profiles?: { id: string; name: string | null; seller_status: SellerStatus; is_admin: boolean } | null
  product_images?: ProductImage[]
}
