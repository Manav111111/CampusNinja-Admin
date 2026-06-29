'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatus(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  const status = formData.get('status') as string

  await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/dashboard/orders')
}

export async function updateOrderNotes(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  const admin_notes = formData.get('admin_notes') as string

  await supabase.from('orders').update({ admin_notes, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/dashboard/orders')
}

export async function updatePaymentStatus(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  const payment_status = formData.get('payment_status') as string

  await supabase.from('orders').update({ payment_status, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/dashboard/orders')
}
