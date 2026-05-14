'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Category, Product } from '@/lib/shop/types'

interface ProductFormProps {
  categories: Category[]
  sellerId: string
  isAdmin: boolean
  product?: Product
}

export default function ProductForm({
  categories,
  sellerId,
  isAdmin,
  product,
}: ProductFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(product?.title ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [stock, setStock] = useState(product?.stock?.toString() ?? '0')
  const [categoryId, setCategoryId] = useState(
    product?.category_id?.toString() ?? ''
  )
  const [isOfficial, setIsOfficial] = useState(product?.is_official ?? false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (submitStatus: 'draft' | 'active') => {
    setLoading(true)
    setError(null)

    if (!title.trim()) {
      setError('상품명을 입력해주세요.')
      setLoading(false)
      return
    }
    const parsedPrice = Number(price)
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError('올바른 가격을 입력해주세요.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    let imageUrl: string | null = null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const filename = `${sellerId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filename, imageFile, { upsert: true })

      if (uploadError) {
        setError('이미지 업로드 실패: ' + uploadError.message)
        setLoading(false)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('product-images').getPublicUrl(filename)
      imageUrl = publicUrl
    }

    const productData = {
      title,
      description: description || null,
      price: parsedPrice,
      stock: Number(stock),
      category_id: categoryId ? Number(categoryId) : null,
      status: submitStatus,
      is_official: isAdmin ? isOfficial : false,
      seller_id: sellerId,
    }

    if (product) {
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', product.id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      if (imageUrl) {
        await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', product.id)
        const { error: imgError } = await supabase.from('product_images').insert({
          product_id: product.id,
          url: imageUrl,
          is_primary: true,
          sort_order: 0,
        })
        if (imgError) {
          setError('이미지 저장 실패: ' + imgError.message)
          setLoading(false)
          return
        }
      }
    } else {
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      if (imageUrl && newProduct) {
        await supabase.from('product_images').insert({
          product_id: newProduct.id,
          url: imageUrl,
          is_primary: true,
          sort_order: 0,
        })
      }
    }

    router.push('/shop/seller')
    router.refresh()
  }

  return (
    <form className="max-w-xl space-y-5">
      <div>
        <Label className="text-slate-300">상품명 *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 border-slate-700 bg-slate-800 text-white"
        />
      </div>

      <div>
        <Label className="text-slate-300">설명</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-300">가격 (원) *</Label>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0"
            className="mt-1 border-slate-700 bg-slate-800 text-white"
          />
        </div>
        <div>
          <Label className="text-slate-300">재고</Label>
          <Input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            min="0"
            className="mt-1 border-slate-700 bg-slate-800 text-white"
          />
        </div>
      </div>

      <div>
        <Label className="text-slate-300">카테고리</Label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
        >
          <option value="">선택 안 함</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label className="text-slate-300">상품 이미지</Label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-slate-400"
        />
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isOfficial"
            checked={isOfficial}
            onChange={(e) => setIsOfficial(e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="isOfficial" className="text-slate-300">
            공식 스토어 상품
          </Label>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => handleSubmit('active')}
          disabled={loading}
        >
          {loading ? '저장 중...' : '등록 (공개)'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit('draft')}
          disabled={loading}
        >
          임시저장
        </Button>
      </div>
    </form>
  )
}
