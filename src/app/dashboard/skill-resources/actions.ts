'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSkillResource(formData: FormData) {
  const supabase = await createAdminClient()
  
  const skill_id = formData.get('skill_id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const type = formData.get('type') as string
  const storage_type = formData.get('storage_type') as string
  
  let file_url = formData.get('file_url') as string
  const drive_url = formData.get('drive_url') as string
  const youtube_url = formData.get('youtube_url') as string
  const external_url = formData.get('external_url') as string
  const thumbnail_url = formData.get('thumbnail_url') as string
  
  const is_active = formData.get('is_active') === 'on'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  // File Upload Handling
  const file = formData.get('file_upload') as File
  if (file && file.size > 0 && storage_type === 'supabase_file') {
    const fileExt = file.name.split('.').pop()
    const fileName = `skill_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `skills/${skill_id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file)

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return { error: 'File upload failed: ' + uploadError.message }
    }

    const { data: publicUrlData } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath)

    file_url = publicUrlData.publicUrl
  }

  const { error } = await supabase.from('skill_resources').insert({
    skill_id, title, description, type, storage_type, 
    file_url, drive_url, youtube_url, external_url, thumbnail_url,
    is_active, sort_order
  })

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/skill-resources')
  redirect('/dashboard/skill-resources')
}

export async function updateSkillResource(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  
  const skill_id = formData.get('skill_id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const type = formData.get('type') as string
  const storage_type = formData.get('storage_type') as string
  
  let file_url = formData.get('file_url') as string
  const drive_url = formData.get('drive_url') as string
  const youtube_url = formData.get('youtube_url') as string
  const external_url = formData.get('external_url') as string
  const thumbnail_url = formData.get('thumbnail_url') as string
  
  const is_active = formData.get('is_active') === 'on'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  const file = formData.get('file_upload') as File
  if (file && file.size > 0 && storage_type === 'supabase_file') {
    const fileExt = file.name.split('.').pop()
    const fileName = `skill_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `skills/${skill_id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file)

    if (uploadError) {
      return { error: 'File upload failed: ' + uploadError.message }
    }

    const { data: publicUrlData } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath)

    file_url = publicUrlData.publicUrl
  }

  const { error } = await supabase.from('skill_resources').update({
    skill_id, title, description, type, storage_type, 
    file_url, drive_url, youtube_url, external_url, thumbnail_url,
    is_active, sort_order
  }).eq('id', id)

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/skill-resources')
  redirect('/dashboard/skill-resources')
}

export async function deleteSkillResource(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string

  await supabase.from('skill_resources').delete().eq('id', id)
  
  revalidatePath('/dashboard/skill-resources')
}
