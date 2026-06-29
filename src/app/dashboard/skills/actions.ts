'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSkill(formData: FormData) {
  const supabase = await createAdminClient()
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const icon_name = formData.get('icon_name') as string || 'code-slash-outline'
  const theme_color = formData.get('theme_color') as string || '#3B82F6'
  const accent_color = formData.get('accent_color') as string || '#DBEAFE'
  const difficulty_level = formData.get('difficulty_level') as string || 'beginner'
  const is_active = formData.get('is_active') === 'on'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  const { error } = await supabase.from('skills').insert({
    name, description, icon_name, theme_color, accent_color, difficulty_level, is_active, sort_order
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/skills')
  redirect('/dashboard/skills')
}

export async function updateSkill(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const icon_name = formData.get('icon_name') as string
  const theme_color = formData.get('theme_color') as string
  const accent_color = formData.get('accent_color') as string
  const difficulty_level = formData.get('difficulty_level') as string
  const is_active = formData.get('is_active') === 'on'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  const { error } = await supabase.from('skills').update({
    name, description, icon_name, theme_color, accent_color, difficulty_level, is_active, sort_order
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/skills')
  redirect('/dashboard/skills')
}

export async function deleteSkill(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string

  await supabase.from('skills').delete().eq('id', id)
  
  revalidatePath('/dashboard/skills')
}
