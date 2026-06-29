'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Extracts the storage file path from a Supabase Storage public URL.
 * e.g. "https://xxx.supabase.co/storage/v1/object/public/banners/banner_123.png"
 *   -> "banner_123.png"
 */
function extractStoragePath(url: string): string | null {
  try {
    const marker = '/storage/v1/object/public/banners/'
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return url.substring(idx + marker.length)
  } catch {
    return null
  }
}

export async function createBanner(formData: FormData) {
  const supabase = await createAdminClient()
  
  const title = formData.get('title') as string
  const subtitle = formData.get('subtitle') as string
  const image_url = formData.get('image_url') as string
  const button_text = formData.get('button_text') as string
  const button_url = formData.get('button_url') as string
  const screen_name = formData.get('screen_name') as string || 'home'
  const priority = parseInt(formData.get('priority') as string) || 0
  const is_active = formData.get('is_active') === 'on'

  if (!image_url) {
    return { error: 'Banner image is required.' }
  }

  const { error } = await supabase.from('banners').insert({
    title, subtitle, image_url, button_text, button_url, screen_name, priority, is_active
  })

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/banners')
  redirect('/dashboard/banners')
}

export async function updateBanner(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  
  const title = formData.get('title') as string
  const subtitle = formData.get('subtitle') as string
  const image_url = formData.get('image_url') as string
  const button_text = formData.get('button_text') as string
  const button_url = formData.get('button_url') as string
  const screen_name = formData.get('screen_name') as string || 'home'
  const priority = parseInt(formData.get('priority') as string) || 0
  const is_active = formData.get('is_active') === 'on'

  if (!image_url) {
    return { error: 'Banner image is required.' }
  }

  // If the image URL changed, clean up the old file from storage
  const { data: existing } = await supabase.from('banners').select('image_url').eq('id', id).single()
  if (existing?.image_url && existing.image_url !== image_url) {
    const oldPath = extractStoragePath(existing.image_url)
    if (oldPath) {
      await supabase.storage.from('banners').remove([oldPath])
    }
  }

  const { error } = await supabase.from('banners').update({
    title, subtitle, image_url, button_text, button_url, screen_name, priority, is_active
  }).eq('id', id)

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/banners')
  redirect('/dashboard/banners')
}

export async function deleteBanner(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string

  // Get the banner first to clean up storage
  const { data: banner } = await supabase.from('banners').select('image_url').eq('id', id).single()
  if (banner?.image_url) {
    const filePath = extractStoragePath(banner.image_url)
    if (filePath) {
      await supabase.storage.from('banners').remove([filePath])
    }
  }

  await supabase.from('banners').delete().eq('id', id)
  
  revalidatePath('/dashboard/banners')
}
