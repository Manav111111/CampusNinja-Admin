'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendFirebaseNotification } from '@/utils/firebaseAdmin'

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
    console.error('❌ Error inserting notification:', error)
    return { error: error.message }
  }

  // Trigger Firebase Push Notification
  console.log('🚀 Triggering push notification via Firebase Admin SDK...')
  await sendFirebaseNotification({
    title,
    body: message,
    targetBranchId: target_branch_id,
    targetSemesterId: target_semester_id,
    sendToAll: !target_branch_id && !target_semester_id,
  })

  revalidatePath('/dashboard/notifications')
  redirect('/dashboard/notifications')
}
