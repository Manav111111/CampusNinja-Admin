'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSystemSettings(formData: FormData) {
  const supabase = await createAdminClient()
  
  const whatsapp_link = formData.get('whatsapp_link') as string
  const instagram_link = formData.get('instagram_link') as string
  const youtube_link = formData.get('youtube_link') as string
  const telegram_link = formData.get('telegram_link') as string

  const { error } = await supabase.from('system_settings').update({
    whatsapp_link,
    instagram_link,
    youtube_link,
    telegram_link,
    updated_at: new Date().toISOString()
  }).eq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
