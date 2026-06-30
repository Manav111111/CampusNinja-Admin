'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateDeliverySettings(formData: FormData): Promise<void> {
  const supabase = await createAdminClient()
  
  const delivery_fee = formData.get('delivery_fee') as string
  const free_delivery_threshold = formData.get('free_delivery_threshold') as string

  const { error } = await supabase
    .from('settings')
    .upsert([
      { key: 'delivery_fee', value: delivery_fee || '49' },
      { key: 'free_delivery_threshold', value: free_delivery_threshold || '499' }
    ], { onConflict: 'key' })

  if (error) {
    console.error('Error saving delivery settings:', error)
    return
  }

  revalidatePath('/dashboard/delivery-settings')
}
