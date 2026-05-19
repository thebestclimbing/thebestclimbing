'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addToCart(productId: string, quantity: number = 1) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' as const }

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: user.id, product_id: productId, quantity })
    if (error) return { error: error.message }
  }

  revalidatePath('/shop/cart')
  return { error: null }
}

export async function removeFromCart(cartItemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' as const }

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/shop/cart')
  return { error: null }
}

export async function clearCart() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' as const }

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/shop/cart')
  return { error: null }
}

export async function updateCartQuantity(cartItemId: string, quantity: number) {
  if (quantity < 1) return removeFromCart(cartItemId)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' as const }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/shop/cart')
  return { error: null }
}

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

export async function cancelPurchaseIntent(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' as const }

  const { error } = await supabase
    .from('purchase_intents')
    .delete()
    .eq('product_id', productId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/shop/intents')
  return { error: null }
}

export async function removePurchaseIntent(intentId: string) {
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

export async function cancelIntentBySeller(intentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, seller_status')
    .eq('id', user.id)
    .single()

  if (profile?.seller_status !== 'approved' && !profile?.is_admin) {
    return { error: 'unauthorized' as const }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('purchase_intents').delete().eq('id', intentId)
  if (error) return { error: error.message }

  revalidatePath('/shop/seller')
  revalidatePath('/shop/admin')
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

export async function updateIntentMemoAsSeller(intentId: string, memo: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' as const }

  const admin = createAdminClient()

  const { data: intent } = await admin
    .from('purchase_intents')
    .select('product_id')
    .eq('id', intentId)
    .single()

  if (!intent) return { error: 'not found' as const }

  const { data: product } = await admin
    .from('products')
    .select('seller_id')
    .eq('id', intent.product_id)
    .single()

  if (!product || product.seller_id !== user.id) return { error: 'unauthorized' as const }

  const { error } = await admin
    .from('purchase_intents')
    .update({ memo })
    .eq('id', intentId)
  if (error) return { error: error.message }

  revalidatePath('/shop/seller')
  return { error: null }
}

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
