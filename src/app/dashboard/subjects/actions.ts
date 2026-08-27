'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSubject(formData: FormData) {
  const supabase = await createAdminClient()
  
  const name = (formData.get('name') as string)?.trim()
  if (!name) {
    return { error: 'Subject name is required.' }
  }

  const short_name = (formData.get('short_name') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null
  const icon_name = (formData.get('icon_name') as string)?.trim() || 'book-outline'
  const theme_color = (formData.get('theme_color') as string)?.trim() || '#EA580C'
  const accent_color = (formData.get('accent_color') as string)?.trim() || '#FFEDD5'
  const category = (formData.get('category') as string)?.trim() || 'theory'
  const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  const { data: newSubject, error } = await supabase.from('subjects').insert({
    name,
    short_name,
    description,
    icon_name,
    theme_color,
    accent_color,
    category,
    is_active,
    sort_order,
    // Note: branch_id and semester_id are kept NULL for pure master subjects
  }).select('id').single()

  if (error) {
    console.error('Error creating master subject:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/subjects')
  revalidatePath('/dashboard/branches')
  redirect('/dashboard/subjects')
}

export async function updateSubject(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  
  if (!id) {
    return { error: 'Subject ID is required.' }
  }

  const name = (formData.get('name') as string)?.trim()
  if (!name) {
    return { error: 'Subject name is required.' }
  }

  const short_name = (formData.get('short_name') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null
  const icon_name = (formData.get('icon_name') as string)?.trim() || 'book-outline'
  const theme_color = (formData.get('theme_color') as string)?.trim() || '#EA580C'
  const accent_color = (formData.get('accent_color') as string)?.trim() || '#FFEDD5'
  const category = (formData.get('category') as string)?.trim() || 'theory'
  const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  const { error } = await supabase.from('subjects').update({
    name,
    short_name,
    description,
    icon_name,
    theme_color,
    accent_color,
    category,
    is_active,
    sort_order,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) {
    console.error('Error updating master subject:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/subjects')
  revalidatePath(`/dashboard/subjects/${id}`)
  revalidatePath('/dashboard/branches')
  redirect('/dashboard/subjects')
}

export async function deleteSubject(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string

  if (!id) return

  // Cascading deletes on branch_subjects, syllabuses, etc. are handled by DB FKs
  await supabase.from('subjects').delete().eq('id', id)
  
  revalidatePath('/dashboard/subjects')
  revalidatePath('/dashboard/branches')
}

/**
 * Assigns a master subject to multiple branch/semester offerings
 */
export async function assignSubjectOffering(formData: FormData) {
  const supabase = await createAdminClient()
  
  const subject_id = formData.get('subject_id') as string
  const branch_id = formData.get('branch_id') as string
  const semester_id = formData.get('semester_id') as string
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  if (!subject_id || !branch_id || !semester_id) {
    return { error: 'Please select both branch and semester.' }
  }

  try {
    const { error } = await supabase.from('branch_subjects').upsert({
      branch_id,
      semester_id,
      subject_id,
      sort_order,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'branch_id,semester_id,subject_id' })

    if (error) {
      console.error('Error assigning subject offering:', error)
      return { error: error.message }
    }
  } catch (err: any) {
    return { error: err.message || 'Failed to assign offering.' }
  }

  revalidatePath(`/dashboard/subjects/${subject_id}`)
  revalidatePath('/dashboard/subjects')
  revalidatePath('/dashboard/branches')
  return { success: true }
}

/**
 * Removes a single branch_subjects assignment
 */
export async function removeSubjectOffering(formData: FormData) {
  const supabase = await createAdminClient()
  const offering_id = formData.get('offering_id') as string
  const subject_id = formData.get('subject_id') as string

  if (!offering_id) return

  await supabase.from('branch_subjects').delete().eq('id', offering_id)

  if (subject_id) {
    revalidatePath(`/dashboard/subjects/${subject_id}`)
  }
  revalidatePath('/dashboard/subjects')
  revalidatePath('/dashboard/branches')
}
