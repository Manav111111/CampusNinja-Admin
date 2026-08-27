'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createBranch(formData: FormData) {
  const supabase = await createAdminClient()
  
  const name = (formData.get('name') as string)?.trim()
  const short_code = (formData.get('short_code') as string)?.trim()
  const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true'

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
  
  const name = (formData.get('name') as string)?.trim()
  const short_code = (formData.get('short_code') as string)?.trim()
  const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true'

  const { error } = await supabase.from('branches').update({
    name, short_code, is_active, updated_at: new Date().toISOString()
  }).eq('id', id)

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/branches')
  revalidatePath(`/dashboard/branches/${id}`)
  redirect('/dashboard/branches')
}

export async function deleteBranch(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string

  await supabase.from('branches').delete().eq('id', id)
  
  revalidatePath('/dashboard/branches')
}

/**
 * Bulk assigns multiple master subjects to a branch semester
 */
export async function assignSubjectsToSemesterAction(
  branchId: string,
  semesterId: string,
  subjectIdsToAdd: string[],
  subjectIdsToRemove: string[]
) {
  const supabase = await createAdminClient()

  if (!branchId || !semesterId) {
    return { error: 'Branch and Semester are required.' }
  }

  // 1. Remove subjects marked for removal
  if (subjectIdsToRemove.length > 0) {
    const { error: delError } = await supabase
      .from('branch_subjects')
      .delete()
      .eq('branch_id', branchId)
      .eq('semester_id', semesterId)
      .in('subject_id', subjectIdsToRemove)

    if (delError) {
      console.error('Error removing subjects from semester:', delError)
      return { error: delError.message }
    }
  }

  // 2. Add new subject assignments
  if (subjectIdsToAdd.length > 0) {
    // Find current max sort_order
    const { data: currentRows } = await supabase
      .from('branch_subjects')
      .select('sort_order')
      .eq('branch_id', branchId)
      .eq('semester_id', semesterId)
      .order('sort_order', { ascending: false })
      .limit(1)

    let baseSort = (currentRows?.[0]?.sort_order ?? 0) + 1

    const records = subjectIdsToAdd.map((sId, idx) => ({
      branch_id: branchId,
      semester_id: semesterId,
      subject_id: sId,
      sort_order: baseSort + idx,
      is_active: true,
      updated_at: new Date().toISOString()
    }))

    const { error: insError } = await supabase
      .from('branch_subjects')
      .upsert(records, { onConflict: 'branch_id,semester_id,subject_id' })

    if (insError) {
      console.error('Error adding subjects to semester:', insError)
      return { error: insError.message }
    }
  }

  revalidatePath(`/dashboard/branches/${branchId}`)
  revalidatePath('/dashboard/branches')
  revalidatePath('/dashboard/subjects')
  return { success: true }
}

/**
 * Removes a single subject assignment from a semester
 */
export async function removeBranchSubjectAction(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  const branch_id = formData.get('branch_id') as string

  if (!id) return

  await supabase.from('branch_subjects').delete().eq('id', id)

  if (branch_id) {
    revalidatePath(`/dashboard/branches/${branch_id}`)
  }
  revalidatePath('/dashboard/branches')
  revalidatePath('/dashboard/subjects')
}

/**
 * Reorders subjects in a semester
 */
export async function reorderBranchSubjectsAction(
  branchId: string,
  orderedAssignments: { id: string; sort_order: number }[]
) {
  const supabase = await createAdminClient()

  for (const item of orderedAssignments) {
    await supabase
      .from('branch_subjects')
      .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
      .eq('id', item.id)
  }

  revalidatePath(`/dashboard/branches/${branchId}`)
  return { success: true }
}
