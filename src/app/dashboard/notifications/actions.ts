'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createNotification(formData: FormData) {
  const supabase = await createAdminClient()
  
  const title = formData.get('title') as string
  const message = formData.get('message') as string
  const target_branch_id = formData.get('target_branch_id') as string || null
  const target_semester_id = formData.get('target_semester_id') as string || null

  const { error } = await supabase.from('notifications').insert({
    title, 
    message, 
    target_branch_id, 
    target_semester_id,
    status: 'sent'
  })

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  // Future enhancement: Trigger Expo Push Notification API here using the title/message

  revalidatePath('/dashboard/notifications')
  redirect('/dashboard/notifications')
}
