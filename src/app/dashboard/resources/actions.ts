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

export interface SyllabusTopicData {
  id?: string;
  title: string;
  description?: string | null;
  sort_order?: number;
}

export interface SyllabusUnitData {
  id?: string;
  unit_number?: number;
  title?: string;
  description?: string | null;
  sort_order?: number;
  topics: SyllabusTopicData[];
}

/**
 * Fetches existing structured syllabus (units and topics) for a given subject.
 */
export async function getSubjectSyllabusData(subjectId: string) {
  if (!subjectId) return null;
  const supabase = await createAdminClient();

  try {
    const { data: sylData, error: sylError } = await supabase
      .from('syllabuses')
      .select('*')
      .eq('subject_id', subjectId)
      .maybeSingle();

    if (sylError || !sylData) return null;

    const { data: unitsData, error: unitsError } = await supabase
      .from('syllabus_units')
      .select('*')
      .eq('syllabus_id', sylData.id)
      .order('sort_order', { ascending: true });

    if (unitsError) return null;

    const rawUnits = unitsData || [];
    const unitIds = rawUnits.map(u => u.id);

    let topicsByUnit: Record<string, SyllabusTopicData[]> = {};
    if (unitIds.length > 0) {
      const { data: topicsData } = await supabase
        .from('syllabus_topics')
        .select('*')
        .in('unit_id', unitIds)
        .order('sort_order', { ascending: true });

      (topicsData || []).forEach(t => {
        if (!topicsByUnit[t.unit_id]) topicsByUnit[t.unit_id] = [];
        topicsByUnit[t.unit_id].push({
          id: t.id,
          title: t.title,
          description: t.description,
          sort_order: t.sort_order,
        });
      });
    }

    const structuredUnits: SyllabusUnitData[] = rawUnits.map((u, idx) => ({
      id: u.id,
      unit_number: u.unit_number || (idx + 1),
      title: u.title,
      description: u.description,
      sort_order: u.sort_order ?? (idx + 1),
      topics: topicsByUnit[u.id] || [],
    }));

    return {
      syllabus: sylData,
      units: structuredUnits,
    };
  } catch (err) {
    console.error('Error fetching subject syllabus data:', err);
    return null;
  }
}

/**
 * Dedicated server action to create or update unit-wise syllabus data
 */
export async function saveSyllabusAction(formData: FormData) {
  const supabase = await createAdminClient()
  const subject_id = formData.get('subject_id') as string

  if (!subject_id) {
    return { error: 'Please select a subject.' }
  }

  // 1. Fetch Subject Info
  const { data: targetSub, error: subError } = await supabase
    .from('subjects')
    .select('id, name, semester_id')
    .eq('id', subject_id)
    .single()

  if (subError || !targetSub) {
    return { error: 'Subject not found.' }
  }

  const subjectTitle = (formData.get('title') as string)?.trim() || `${targetSub.name} Syllabus`
  const description = (formData.get('description') as string)?.trim() || null
  const apply_to_all_branches = formData.get('apply_to_all_branches') === 'on' || formData.get('apply_to_all_branches') === 'true'
  const is_active = formData.get('is_active') !== 'off' && formData.get('is_active') !== 'false'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  // 2. Parse Units & Topics Data
  const rawUnitsData = formData.get('units_data') as string
  let parsedUnits: SyllabusUnitData[] = []
  try {
    if (rawUnitsData) {
      parsedUnits = JSON.parse(rawUnitsData)
    }
  } catch (e) {
    return { error: 'Invalid syllabus units data.' }
  }

  if (!parsedUnits || parsedUnits.length === 0) {
    return { error: 'Please add at least 1 unit to the syllabus.' }
  }

  // Sanitize and validate units & topics
  for (let i = 0; i < parsedUnits.length; i++) {
    const unit = parsedUnits[i]
    const unitNum = unit.unit_number || (i + 1)
    if (!unit.title || !unit.title.trim()) {
      unit.title = `Unit ${unitNum}`
    } else {
      unit.title = unit.title.trim()
    }

    // Filter out blank topics
    unit.topics = (unit.topics || [])
      .map(t => ({
        ...t,
        title: (t.title || '').trim(),
      }))
      .filter(t => t.title.length > 0)

    if (unit.topics.length === 0) {
      return { error: `Unit ${unitNum} ("${unit.title}") has no topics. Please add at least one topic.` }
    }
  }

  // 3. Handle Optional Reference File / PDF
  let file_url: string | null = (formData.get('existing_file_url') as string) || null
  let file_name: string | null = (formData.get('existing_file_name') as string) || null
  let file_path: string | null = (formData.get('existing_file_path') as string) || null
  const storage_type = (formData.get('storage_type') as string) || 'none'

  if (storage_type === 'supabase_file') {
    const file = formData.get('file_upload') as File
    if (file && file.size > 0) {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `syllabuses/${subject_id}/${Date.now()}_${cleanName}`

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) {
        console.error('Syllabus PDF upload error:', uploadError)
        return { error: 'File upload failed: ' + uploadError.message }
      }

      const { data: publicUrlData } = supabase.storage.from('resources').getPublicUrl(filePath)
      file_url = publicUrlData.publicUrl
      file_name = file.name
      file_path = filePath
    }
  } else if (storage_type === 'google_drive') {
    let rawDrive = (formData.get('drive_url') as string)?.trim()
    if (rawDrive) {
      if (!rawDrive.startsWith('http://') && !rawDrive.startsWith('https://')) rawDrive = 'https://' + rawDrive
      file_url = rawDrive
      file_name = 'Google Drive Document'
      file_path = null
    }
  } else if (storage_type === 'external_link') {
    let rawExt = (formData.get('external_url') as string)?.trim()
    if (rawExt) {
      if (!rawExt.startsWith('http://') && !rawExt.startsWith('https://')) rawExt = 'https://' + rawExt
      file_url = rawExt
      file_name = 'External Syllabus Link'
      file_path = null
    }
  }

  // 4. Resolve Target Subject IDs (Multi-branch publishing)
  let targetSubjectIds = [subject_id]
  if (apply_to_all_branches && targetSub.name) {
    const rawName = targetSub.name.trim()
    const baseName = rawName.replace(/s$/i, '')
    const { data: matchingSubs } = await supabase
      .from('subjects')
      .select('id, name')
      .or(`name.ilike.%${rawName}%,name.ilike.%${baseName}%`)

    if (matchingSubs && matchingSubs.length > 0) {
      targetSubjectIds = Array.from(new Set([subject_id, ...matchingSubs.map(s => s.id)]))
    }
  }

  // 5. Execute Safe Database Sync for each target subject
  for (const sid of targetSubjectIds) {
    // a. Upsert Syllabus Record
    const { data: sylRecord, error: sylError } = await supabase
      .from('syllabuses')
      .upsert({
        subject_id: sid,
        file_url: file_url,
        file_name: file_name,
        file_path: file_path,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'subject_id' })
      .select('id')
      .single()

    if (sylError || !sylRecord) {
      console.error('Error upserting syllabus header:', sylError)
      return { error: 'Failed to save syllabus header: ' + (sylError?.message || 'Unknown error') }
    }

    const syllabusId = sylRecord.id

    // b. Fetch existing units for this syllabus
    const { data: existingUnits } = await supabase
      .from('syllabus_units')
      .select('id')
      .eq('syllabus_id', syllabusId)

    const existingUnitIds = new Set((existingUnits || []).map(u => u.id))
    const incomingUnitIds = new Set(parsedUnits.map(u => u.id).filter(Boolean) as string[])

    // Delete units removed by admin (only if updating primary subject where IDs match)
    const unitsToDelete = [...existingUnitIds].filter(id => !incomingUnitIds.has(id))
    if (unitsToDelete.length > 0) {
      await supabase.from('syllabus_units').delete().in('id', unitsToDelete)
    }

    // c. Process each unit and its topics
    for (let uIdx = 0; uIdx < parsedUnits.length; uIdx++) {
      const u = parsedUnits[uIdx]
      const unitNumber = uIdx + 1
      const uSortOrder = u.sort_order ?? (uIdx + 1)
      let unitId = u.id

      if (unitId && existingUnitIds.has(unitId) && sid === subject_id) {
        // Update existing unit
        await supabase
          .from('syllabus_units')
          .update({
            unit_number: unitNumber,
            title: u.title,
            description: u.description || null,
            sort_order: uSortOrder,
            updated_at: new Date().toISOString(),
          })
          .eq('id', unitId)
      } else {
        // Insert new unit for this syllabus
        const { data: newUnit, error: insertUnitErr } = await supabase
          .from('syllabus_units')
          .insert({
            syllabus_id: syllabusId,
            subject_id: sid,
            unit_number: unitNumber,
            title: u.title,
            description: u.description || null,
            sort_order: uSortOrder,
          })
          .select('id')
          .single()

        if (insertUnitErr || !newUnit) {
          console.error('Error inserting unit:', insertUnitErr)
          continue
        }
        unitId = newUnit.id
      }

      if (!unitId) continue

      // d. Reconcile topics for this unit
      const { data: existingTopics } = await supabase
        .from('syllabus_topics')
        .select('id')
        .eq('unit_id', unitId)

      const existingTopicIds = new Set((existingTopics || []).map(t => t.id))
      const incomingTopicIds = new Set((u.topics || []).map(t => t.id).filter(Boolean) as string[])

      // Delete removed topics
      const topicsToDelete = [...existingTopicIds].filter(id => !incomingTopicIds.has(id))
      if (topicsToDelete.length > 0) {
        await supabase.from('syllabus_topics').delete().in('id', topicsToDelete)
      }

      // Upsert topics
      const topics = u.topics || []
      for (let tIdx = 0; tIdx < topics.length; tIdx++) {
        const t = topics[tIdx]
        const tSortOrder = t.sort_order ?? (tIdx + 1)

        if (t.id && existingTopicIds.has(t.id) && sid === subject_id) {
          await supabase
            .from('syllabus_topics')
            .update({
              title: t.title,
              description: t.description || null,
              sort_order: tSortOrder,
              updated_at: new Date().toISOString(),
            })
            .eq('id', t.id)
        } else {
          await supabase
            .from('syllabus_topics')
            .insert({
              unit_id: unitId,
              title: t.title,
              description: t.description || null,
              sort_order: tSortOrder,
            })
        }
      }
    }

    // e. Synchronize / maintain resource row for dashboard visibility
    const { data: existingRes } = await supabase
      .from('resources')
      .select('id')
      .eq('subject_id', sid)
      .eq('type', 'syllabus')
      .maybeSingle()

    if (existingRes) {
      await supabase.from('resources').update({
        title: subjectTitle,
        description,
        storage_type: storage_type === 'none' ? 'supabase_file' : storage_type,
        file_url: file_url || null,
        is_active,
        sort_order,
      }).eq('id', existingRes.id)
    } else {
      await supabase.from('resources').insert({
        subject_id: sid,
        title: subjectTitle,
        description,
        type: 'syllabus',
        storage_type: storage_type === 'none' ? 'supabase_file' : storage_type,
        file_url: file_url || null,
        is_active,
        sort_order,
      })
    }
  }

  revalidatePath('/dashboard/resources')
  redirect('/dashboard/resources')
}

export async function createResource(formData: FormData) {
  const type = formData.get('type') as string || 'notes'

  if (type === 'syllabus') {
    return saveSyllabusAction(formData)
  }

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

  let targetSubjectIds = [subject_id]
  const apply_to_all_branches = formData.get('apply_to_all_branches') === 'on' || formData.get('apply_to_all_branches') === 'true'

  if (apply_to_all_branches) {
    const { data: targetSub } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', subject_id)
      .single()

    if (targetSub && targetSub.name) {
      const rawName = targetSub.name.trim()
      const baseName = rawName.replace(/s$/i, '')
      const { data: matchingSubs } = await supabase
        .from('subjects')
        .select('id')
        .or(`name.ilike.%${rawName}%,name.ilike.%${baseName}%`)

      if (matchingSubs && matchingSubs.length > 0) {
        targetSubjectIds = Array.from(new Set([subject_id, ...matchingSubs.map(s => s.id)]))
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
  const type = formData.get('type') as string

  if (type === 'syllabus') {
    return saveSyllabusAction(formData)
  }

  const supabase = await createAdminClient()
  const id = formData.get('id') as string
  if (!id) return { error: 'Resource ID missing.' }
  
  const subject_id = formData.get('subject_id') as string
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
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

  const { data: res } = await supabase.from('resources').select('file_url, storage_type, type, subject_id').eq('id', id).single()
  if (res) {
    if (res.storage_type === 'supabase_file' && res.file_url) {
      try {
        const parts = res.file_url.split('/public/resources/')
        if (parts[1]) {
          await supabase.storage.from('resources').remove([decodeURIComponent(parts[1])])
        }
      } catch (e) {
        console.error("Failed to remove storage object:", e)
      }
    }

    // If deleting a syllabus resource, also clean up the syllabuses table for that subject if needed
    if (res.type === 'syllabus') {
      await supabase.from('syllabuses').delete().eq('subject_id', res.subject_id)
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
