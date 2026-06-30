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

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export async function createResource(formData: FormData) {
  const supabase = await createAdminClient()
  
  const subject_id = formData.get('subject_id') as string
  if (!subject_id) {
    return { error: 'Please select a subject.' }
  }

  const title = (formData.get('title') as string)?.trim()
  if (!title) {
    return { error: 'Title is required.' }
  }

  const description = (formData.get('description') as string)?.trim() || null
  const type = formData.get('type') as string || 'notes'
  const storage_type = formData.get('storage_type') as string || 'supabase_file'
  
  let file_url: string | null = null
  let file_size: string | null = null
  let file_format: string | null = null
  let drive_url: string | null = null
  let youtube_url: string | null = null
  let external_url: string | null = null
  let thumbnail_url: string | null = (formData.get('thumbnail_url') as string)?.trim() || null
  
  const is_popular = formData.get('is_popular') === 'on'
  const is_active = formData.get('is_active') !== 'off' && formData.get('is_active') !== 'false'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  if (storage_type === 'supabase_file') {
    const file = formData.get('file_upload') as File
    if (!file || file.size === 0) {
      return { error: 'Please select a file (PDF, DOCX, ZIP) to upload.' }
    }

    const fileExt = file.name.split('.').pop() || 'file'
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`
    const filePath = `${subject_id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return { error: 'File upload failed: ' + uploadError.message }
    }

    const { data: publicUrlData } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath)

    file_url = publicUrlData.publicUrl
    file_size = formatBytes(file.size)
    file_format = fileExt.toUpperCase()
  } else if (storage_type === 'google_drive') {
    let rawDrive = (formData.get('drive_url') as string)?.trim()
    if (!rawDrive) {
      return { error: 'Google Drive URL is required.' }
    }
    if (!rawDrive.startsWith('http://') && !rawDrive.startsWith('https://')) {
      rawDrive = 'https://' + rawDrive
    }
    drive_url = rawDrive
  } else if (storage_type === 'youtube') {
    let rawYt = (formData.get('youtube_url') as string)?.trim()
    if (!rawYt) {
      return { error: 'YouTube Video URL is required.' }
    }
    if (!rawYt.startsWith('http://') && !rawYt.startsWith('https://')) {
      rawYt = 'https://' + rawYt
    }
    const videoId = extractYouTubeId(rawYt)
    if (videoId) {
      youtube_url = `https://www.youtube.com/watch?v=${videoId}`
      if (!thumbnail_url) {
        thumbnail_url = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      }
    } else {
      youtube_url = rawYt
    }
  } else if (storage_type === 'external_link') {
    let rawExt = (formData.get('external_url') as string)?.trim()
    if (!rawExt) {
      return { error: 'External URL is required.' }
    }
    if (!rawExt.startsWith('http://') && !rawExt.startsWith('https://')) {
      rawExt = 'https://' + rawExt
    }
    external_url = rawExt
  }

  const apply_to_all_branches = formData.get('apply_to_all_branches') === 'on'

  let targetSubjectIds = [subject_id]
  if (apply_to_all_branches) {
    const { data: targetSub } = await supabase
      .from('subjects')
      .select('name, semester_id')
      .eq('id', subject_id)
      .single()

    if (targetSub) {
      const { data: matchingSubs } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', targetSub.name)
        .eq('semester_id', targetSub.semester_id)

      if (matchingSubs && matchingSubs.length > 0) {
        targetSubjectIds = matchingSubs.map(s => s.id)
      }
    }
  }

  const recordsToInsert = targetSubjectIds.map(sid => ({
    subject_id: sid, title, description, type, storage_type, 
    file_url, drive_url, youtube_url, external_url, thumbnail_url,
    file_size, file_format, is_popular, is_active, sort_order
  }))

  const { error } = await supabase.from('resources').insert(recordsToInsert)

  if (error) {
    console.error("Database insert error:", error)
    return { error: 'Database error: ' + error.message }
  }

  revalidatePath('/dashboard/resources')
  redirect('/dashboard/resources')
}

export async function updateResource(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  if (!id) return { error: 'Resource ID missing.' }
  
  const subject_id = formData.get('subject_id') as string
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const type = formData.get('type') as string
  const storage_type = formData.get('storage_type') as string
  
  let file_url: string | null = (formData.get('existing_file_url') as string) || null
  let file_size: string | null = (formData.get('existing_file_size') as string) || null
  let file_format: string | null = (formData.get('existing_file_format') as string) || null
  
  let drive_url: string | null = null
  let youtube_url: string | null = null
  let external_url: string | null = null
  let thumbnail_url: string | null = (formData.get('thumbnail_url') as string)?.trim() || null
  
  const is_popular = formData.get('is_popular') === 'on'
  const is_active = formData.get('is_active') !== 'off' && formData.get('is_active') !== 'false'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  if (storage_type === 'supabase_file') {
    const file = formData.get('file_upload') as File
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop() || 'file'
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`
      const filePath = `${subject_id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        return { error: 'File upload failed: ' + uploadError.message }
      }

      const { data: publicUrlData } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath)

      file_url = publicUrlData.publicUrl
      file_size = formatBytes(file.size)
      file_format = fileExt.toUpperCase()
    }
    drive_url = null
    youtube_url = null
    external_url = null
  } else if (storage_type === 'google_drive') {
    let rawDrive = (formData.get('drive_url') as string)?.trim()
    if (!rawDrive) return { error: 'Google Drive URL is required.' }
    if (!rawDrive.startsWith('http://') && !rawDrive.startsWith('https://')) rawDrive = 'https://' + rawDrive
    drive_url = rawDrive
    file_url = null
    youtube_url = null
    external_url = null
  } else if (storage_type === 'youtube') {
    let rawYt = (formData.get('youtube_url') as string)?.trim()
    if (!rawYt) return { error: 'YouTube Video URL is required.' }
    if (!rawYt.startsWith('http://') && !rawYt.startsWith('https://')) rawYt = 'https://' + rawYt
    const videoId = extractYouTubeId(rawYt)
    if (videoId) {
      youtube_url = `https://www.youtube.com/watch?v=${videoId}`
      if (!thumbnail_url) thumbnail_url = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    } else {
      youtube_url = rawYt
    }
    file_url = null
    drive_url = null
    external_url = null
  } else if (storage_type === 'external_link') {
    let rawExt = (formData.get('external_url') as string)?.trim()
    if (!rawExt) return { error: 'External URL is required.' }
    if (!rawExt.startsWith('http://') && !rawExt.startsWith('https://')) rawExt = 'https://' + rawExt
    external_url = rawExt
    file_url = null
    drive_url = null
    youtube_url = null
  }

  const { error } = await supabase.from('resources').update({
    subject_id, title, description, type, storage_type, 
    file_url, drive_url, youtube_url, external_url, thumbnail_url,
    file_size, file_format, is_popular, is_active, sort_order
  }).eq('id', id)

  if (error) {
    console.error("Update error:", error)
    return { error: 'Update failed: ' + error.message }
  }

  revalidatePath('/dashboard/resources')
  redirect('/dashboard/resources')
}

export async function deleteResource(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  if (!id) return

  const { data: res } = await supabase.from('resources').select('file_url, storage_type').eq('id', id).single()
  if (res && res.storage_type === 'supabase_file' && res.file_url) {
    try {
      const parts = res.file_url.split('/public/resources/')
      if (parts[1]) {
        await supabase.storage.from('resources').remove([decodeURIComponent(parts[1])])
      }
    } catch (e) {
      console.error("Failed to remove storage object:", e)
    }
  }

  await supabase.from('resources').delete().eq('id', id)
  revalidatePath('/dashboard/resources')
}

export async function toggleResourceStatus(formData: FormData) {
  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  const currentStatus = formData.get('current_status') === 'true'
  if (!id) return

  await supabase.from('resources').update({ is_active: !currentStatus }).eq('id', id)
  revalidatePath('/dashboard/resources')
}

