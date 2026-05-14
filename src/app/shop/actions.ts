'use server'

import { createClient } from '@/lib/supabase/server'
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
