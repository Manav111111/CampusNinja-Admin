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
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

    const contentType = request.headers.get('content-type') || ''

    // 1. FAST DIRECT SIGNED URL REQUEST
    // Enables browser to stream directly to Supabase Storage CDN (bypasses Vercel/Next 4.5MB limits)
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const { fileName: reqFileName, fileSize, folder = 'general' } = body

      if (!reqFileName) {
        return NextResponse.json({ error: 'File name is required' }, { status: 400 })
      }

      // Maximum file size: 100MB
      const maxSize = 100 * 1024 * 1024
      if (fileSize && Number(fileSize) > maxSize) {
        return NextResponse.json(
          { error: 'File is too large. Maximum allowed size is 100MB.' },
          { status: 400 }
        )
      }

      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      // Ensure bucket exists and has 100MB limit
      const { error: bucketError } = await supabase.storage.createBucket('resources', {
        public: true,
        fileSizeLimit: 100 * 1024 * 1024,
      })
      if (bucketError && !bucketError.message.includes('already exists')) {
        console.warn('Bucket verify warning:', bucketError.message)
      } else {
        await supabase.storage.updateBucket('resources', {
          public: true,
          fileSizeLimit: 100 * 1024 * 1024,
        })
      }

      const originalName = reqFileName || 'document.pdf'
      const ext = originalName.split('.').pop()?.toLowerCase() || 'pdf'
      const baseName = originalName
        .substring(0, originalName.lastIndexOf('.'))
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 50) || 'file'
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${baseName}.${ext}`
      const filePath = `${folder}/${fileName}`

      const { data: signData, error: signError } = await supabase.storage
        .from('resources')
        .createSignedUploadUrl(filePath)

      if (signError || !signData) {
        console.error('createSignedUploadUrl error:', signError)
        return NextResponse.json(
          { error: `Failed to create upload URL: ${signError?.message || 'Unknown error'}` },
          { status: 500 }
        )
      }

      const { data: urlData } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath)

      return NextResponse.json({
        success: true,
        signedUrl: signData.signedUrl,
        token: signData.token,
        path: filePath,
        publicUrl: urlData.publicUrl,
        anonKey: anonKey,
        fileName: originalName,
        fileSize: formatBytes(fileSize || 0),
        fileFormat: ext.toUpperCase(),
        rawSize: fileSize,
      })
    }

    // 2. MULTIPART / FORMDATA FALLBACK
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

    // Ensure the 'resources' storage bucket exists with 100MB limit
    const { error: bucketError } = await supabase.storage.createBucket('resources', {
      public: true,
      fileSizeLimit: 100 * 1024 * 1024,
    })
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.warn('Bucket verify warning:', bucketError.message)
    } else {
      await supabase.storage.updateBucket('resources', {
        public: true,
        fileSizeLimit: 100 * 1024 * 1024,
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

    // Convert to Buffer/Uint8Array for streaming to Supabase
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
