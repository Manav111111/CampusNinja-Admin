'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createBranch(formData: FormData) {
  const supabase = await createAdminClient()
  
  const name = formData.get('name') as string
  const short_code = formData.get('short_code') as string
  const is_active = formData.get('is_active') === 'on'

  const { error } = await supabase.from('branches').insert({
    name, short_code, is_active
  })

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/branches')
  redirect('/dashboard/branches')
}

export async function updateBranch(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  
  const name = formData.get('name') as string
  const short_code = formData.get('short_code') as string
  const is_active = formData.get('is_active') === 'on'

  const { error } = await supabase.from('branches').update({
    name, short_code, is_active
  }).eq('id', id)

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/branches')
  redirect('/dashboard/branches')
}

export async function deleteBranch(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string

  await supabase.from('branches').delete().eq('id', id)
  
  revalidatePath('/dashboard/branches')
}
