'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSocialLink(formData: FormData) {
  const supabase = await createAdminClient()
  
  const name = formData.get('name') as string
  const platform = formData.get('platform') as string
  const url = formData.get('url') as string
  const description = formData.get('description') as string
  const subscriber_count = formData.get('subscriber_count') as string
  const icon_url = formData.get('icon_url') as string
  const sort_order = parseInt(formData.get('sort_order') as string) || 0
  const is_active = formData.get('is_active') === 'on'

  if (!name || !url || !platform) {
    return { error: 'Name, Platform, and URL are required.' }
  }

  const { error } = await supabase.from('social_links').insert({
    name, platform, url, description, subscriber_count, icon_url, sort_order, is_active
  })

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/social-links')
  redirect('/dashboard/social-links')
}

export async function updateSocialLink(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  
  const name = formData.get('name') as string
  const platform = formData.get('platform') as string
  const url = formData.get('url') as string
  const description = formData.get('description') as string
  const subscriber_count = formData.get('subscriber_count') as string
  const icon_url = formData.get('icon_url') as string
  const sort_order = parseInt(formData.get('sort_order') as string) || 0
  const is_active = formData.get('is_active') === 'on'

  if (!name || !url || !platform) {
    return { error: 'Name, Platform, and URL are required.' }
  }

  const { error } = await supabase.from('social_links').update({
    name, platform, url, description, subscriber_count, icon_url, sort_order, is_active
  }).eq('id', id)

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/social-links')
  redirect('/dashboard/social-links')
}

export async function deleteSocialLink(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string

  await supabase.from('social_links').delete().eq('id', id)
  revalidatePath('/dashboard/social-links')
}
