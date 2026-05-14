import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductForm from '@/components/shop/products/product-form'

export default async function NewProductPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: categories }] = await Promise.all([
    supabase
      .from('profiles')
      .select('seller_status, is_admin')
      .eq('id', user.id)
      .single(),
    supabase.from('categories').select('*').order('name'),
  ])

  if (profile?.seller_status !== 'approved' && !profile?.is_admin) {
    redirect('/shop/seller/apply')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-white">상품 등록</h1>
      <ProductForm
        categories={categories ?? []}
        sellerId={user.id}
        isAdmin={profile?.is_admin ?? false}
      />
    </div>
  )
}
