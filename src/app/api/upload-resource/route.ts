import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300 // Allow up to 300 seconds for large uploads
export const dynamic = 'force-dynamic'

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing env vars:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey,
      })
      return NextResponse.json(
        { error: 'Server configuration error: missing Supabase credentials' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || (formData.get('subject_id') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Maximum file size: 100MB
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File is too large. Maximum allowed size is 100MB.' },
        { status: 400 }
      )
    }

    // Bypass RLS for admin uploads using service_role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Ensure the 'resources' storage bucket exists with 100MB limit and is updated if already existing
    const { error: bucketError } = await supabase.storage.createBucket('resources', {
      public: true,
      fileSizeLimit: 100 * 1024 * 1024, // 100MB
    })
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.warn('Bucket verify warning:', bucketError.message)
    } else {
      // Ensure existing bucket has the 100MB size limit
      await supabase.storage.updateBucket('resources', {
        public: true,
        fileSizeLimit: 100 * 1024 * 1024, // 100MB
      })
    }

    // Generate clean unique filename
    const originalName = file.name || 'document.pdf'
    const ext = originalName.split('.').pop()?.toLowerCase() || 'pdf'
    const baseName = originalName
      .substring(0, originalName.lastIndexOf('.'))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50) || 'file'
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${baseName}.${ext}`
    const filePath = `${folder}/${fileName}`

    // Convert to Buffer/Uint8Array for reliable streaming to Supabase
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError.message)
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('resources')
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: originalName,
      fileSize: formatBytes(file.size),
      fileFormat: ext.toUpperCase(),
      rawSize: file.size,
      path: data.path,
    })
  } catch (err: any) {
    console.error('Upload resource API error:', err?.message || err)
    return NextResponse.json(
      { error: `Upload failed: ${err?.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}
