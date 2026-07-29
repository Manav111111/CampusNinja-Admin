'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProduct(formData: FormData) {
  const supabase = await createAdminClient()
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string) || 0
  const category = formData.get('category') as string
  const thumbnail_url = formData.get('thumbnail_url') as string
  const drive_link = formData.get('drive_link') as string
  const is_active = formData.get('is_active') === 'on'
  const requires_file_upload = formData.get('requires_file_upload') === 'on'
  const upload_instructions = formData.get('upload_instructions') as string || null
  const payment_options = formData.get('payment_options') as string || 'cod'

  const { error } = await supabase.from('products').insert({
    title, description, price, category, thumbnail_url, drive_link, is_active, requires_file_upload, upload_instructions, payment_options
  })

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function updateProduct(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string) || 0
  const category = formData.get('category') as string
  const thumbnail_url = formData.get('thumbnail_url') as string
  const drive_link = formData.get('drive_link') as string
  const is_active = formData.get('is_active') === 'on'
  const requires_file_upload = formData.get('requires_file_upload') === 'on'
  const upload_instructions = formData.get('upload_instructions') as string || null
  const payment_options = formData.get('payment_options') as string || 'cod'

  const { error } = await supabase.from('products').update({
    title, description, price, category, thumbnail_url, drive_link, is_active, requires_file_upload, upload_instructions, payment_options
  }).eq('id', id)

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function deleteProduct(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string

  await supabase.from('products').delete().eq('id', id)
  
  revalidatePath('/dashboard/products')
}
