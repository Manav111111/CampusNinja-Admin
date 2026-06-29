'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export async function createResource(formData: FormData) {
  const supabase = await createAdminClient()
  
  const subject_id = formData.get('subject_id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const type = formData.get('type') as string
  const storage_type = formData.get('storage_type') as string
  
  let file_url = formData.get('file_url') as string
  let file_size = formData.get('file_size') as string
  let file_format = formData.get('file_format') as string
  
  const drive_url = formData.get('drive_url') as string
  const youtube_url = formData.get('youtube_url') as string
  const external_url = formData.get('external_url') as string
  const thumbnail_url = formData.get('thumbnail_url') as string
  
  const is_popular = formData.get('is_popular') === 'on'
  const is_active = formData.get('is_active') === 'on'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  // File Upload Handling
  const file = formData.get('file_upload') as File
  if (file && file.size > 0 && storage_type === 'supabase_file') {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `${subject_id}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
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
    file_size = formatBytes(file.size)
    file_format = fileExt?.toUpperCase() || ''
  }

  const { error } = await supabase.from('resources').insert({
    subject_id, title, description, type, storage_type, 
    file_url, drive_url, youtube_url, external_url, thumbnail_url,
    file_size, file_format, is_popular, is_active, sort_order
  })

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/resources')
  redirect('/dashboard/resources')
}

export async function updateResource(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  
  const subject_id = formData.get('subject_id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const type = formData.get('type') as string
  const storage_type = formData.get('storage_type') as string
  
  let file_url = formData.get('file_url') as string
  let file_size = formData.get('file_size') as string
  let file_format = formData.get('file_format') as string
  
  const drive_url = formData.get('drive_url') as string
  const youtube_url = formData.get('youtube_url') as string
  const external_url = formData.get('external_url') as string
  const thumbnail_url = formData.get('thumbnail_url') as string
  
  const is_popular = formData.get('is_popular') === 'on'
  const is_active = formData.get('is_active') === 'on'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  const file = formData.get('file_upload') as File
  if (file && file.size > 0 && storage_type === 'supabase_file') {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `${subject_id}/${fileName}`

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
    file_size = formatBytes(file.size)
    file_format = fileExt?.toUpperCase() || ''
  }

  const { error } = await supabase.from('resources').update({
    subject_id, title, description, type, storage_type, 
    file_url, drive_url, youtube_url, external_url, thumbnail_url,
    file_size, file_format, is_popular, is_active, sort_order
  }).eq('id', id)

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/resources')
  redirect('/dashboard/resources')
}

export async function deleteResource(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string

  // Note: For a complete implementation, we should also delete the file from Supabase storage if storage_type === 'supabase_file'
  await supabase.from('resources').delete().eq('id', id)
  
  revalidatePath('/dashboard/resources')
}
