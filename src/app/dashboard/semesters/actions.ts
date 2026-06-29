'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSemester(formData: FormData) {
  const supabase = await createAdminClient()
  
  const branch_id = formData.get('branch_id') as string
  const number = parseInt(formData.get('number') as string)
  const is_active = formData.get('is_active') === 'on'

  if (branch_id === 'ALL') {
    // Fetch all active branches
    const { data: branches } = await supabase.from('branches').select('id').eq('is_active', true)
    
    if (branches && branches.length > 0) {
      const inserts = branches.map(b => ({
        branch_id: b.id,
        number,
        is_active
      }))
      
      const { error } = await supabase.from('semesters').insert(inserts)
      if (error) {
        console.error(error)
        return { error: error.message }
      }
    }
  } else {
    // Insert single branch
    const { error } = await supabase.from('semesters').insert({
      branch_id, number, is_active
    })

    if (error) {
      console.error(error)
      return { error: error.message }
    }
  }

  revalidatePath('/dashboard/semesters')
  redirect('/dashboard/semesters')
}

export async function updateSemester(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  
  const branch_id = formData.get('branch_id') as string
  const number = parseInt(formData.get('number') as string)
  const is_active = formData.get('is_active') === 'on'

  const { error } = await supabase.from('semesters').update({
    branch_id, number, is_active
  }).eq('id', id)

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/semesters')
  redirect('/dashboard/semesters')
}

export async function deleteSemester(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string

  await supabase.from('semesters').delete().eq('id', id)
  
  revalidatePath('/dashboard/semesters')
}
