'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSubject(formData: FormData) {
  const supabase = await createAdminClient()
  
  const branch_id = formData.get('branch_id') as string
  const name = formData.get('name') as string
  const short_name = formData.get('short_name') as string
  const description = formData.get('description') as string
  const icon_name = formData.get('icon_name') as string || 'book-outline'
  const theme_color = formData.get('theme_color') as string || '#EA580C'
  const accent_color = formData.get('accent_color') as string || '#FFEDD5'
  const category = formData.get('category') as string || 'theory'
  const is_active = formData.get('is_active') === 'on'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  if (branch_id === 'ALL') {
    const target_semester_number = parseInt(formData.get('target_semester_number') as string)
    // Find all semesters with this number
    const { data: matchedSemesters } = await supabase
      .from('semesters')
      .select('id, branch_id')
      .eq('number', target_semester_number)
      .eq('is_active', true)
    
    if (matchedSemesters && matchedSemesters.length > 0) {
      const inserts = matchedSemesters.map(sem => ({
        branch_id: sem.branch_id,
        semester_id: sem.id,
        name,
        short_name,
        description,
        icon_name,
        theme_color,
        accent_color,
        category,
        is_active,
        sort_order
      }))

      const { error } = await supabase.from('subjects').insert(inserts)
      if (error) {
        console.error(error)
        return { error: error.message }
      }
    }
  } else {
    const semester_id = formData.get('semester_id') as string
    const { error } = await supabase.from('subjects').insert({
      branch_id, semester_id, name, short_name, description, icon_name, theme_color, accent_color, category, is_active, sort_order
    })

    if (error) {
      console.error(error)
      return { error: error.message }
    }
  }

  revalidatePath('/dashboard/subjects')
  redirect('/dashboard/subjects')
}

export async function updateSubject(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  
  const branch_id = formData.get('branch_id') as string
  const semester_id = formData.get('semester_id') as string
  const name = formData.get('name') as string
  const short_name = formData.get('short_name') as string
  const description = formData.get('description') as string
  const icon_name = formData.get('icon_name') as string
  const theme_color = formData.get('theme_color') as string
  const accent_color = formData.get('accent_color') as string
  const category = formData.get('category') as string
  const is_active = formData.get('is_active') === 'on'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  const { error } = await supabase.from('subjects').update({
    branch_id, semester_id, name, short_name, description, icon_name, theme_color, accent_color, category, is_active, sort_order
  }).eq('id', id)

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/subjects')
  redirect('/dashboard/subjects')
}

export async function deleteSubject(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string

  await supabase.from('subjects').delete().eq('id', id)
  
  revalidatePath('/dashboard/subjects')
}
