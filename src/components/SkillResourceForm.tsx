'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  X 
} from 'lucide-react'
import { createSkillResource, updateSkillResource } from '@/app/dashboard/skill-resources/actions'

export default function SkillResourceForm({ 
  initialData, 
  skills = [] 
}: { 
  initialData?: any, 
  skills?: { id: string, name: string, difficulty_level?: string }[] 
}) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storageType, setStorageType] = useState(initialData?.storage_type || 'supabase_file')
  const [selectedSkillId, setSelectedSkillId] = useState(initialData?.skill_id || (skills[0]?.id || ''))

  // Fast Async Upload State
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadBytesStatus, setUploadBytesStatus] = useState<string>('')
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>(initialData?.file_url || '')
  const [uploadedFileName, setUploadedFileName] = useState<string>(
    initialData?.file_url ? (initialData.file_url.split('/').pop() || 'Existing Attachment') : ''
  )
  const [uploadError, setUploadError] = useState<string | null>(null)
  const activeUploadXhrRef = useRef<XMLHttpRequest | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFileWithProgress = (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File is too large. Maximum allowed size is 50MB.')
      return
    }

    if (activeUploadXhrRef.current) {
      activeUploadXhrRef.current.abort()
      activeUploadXhrRef.current = null
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)
    setUploadedFileName(file.name)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', `skills_${selectedSkillId || 'general'}`)

    const xhr = new XMLHttpRequest()
    activeUploadXhrRef.current = xhr

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        setUploadProgress(percent)
        const loadedMB = (event.loaded / (1024 * 1024)).toFixed(2)
        const totalMB = (event.total / (1024 * 1024)).toFixed(2)
        setUploadBytesStatus(`${loadedMB} MB / ${totalMB} MB (${percent}%)`)
      }
    }

    xhr.onload = () => {
      activeUploadXhrRef.current = null
      setIsUploading(false)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText)
          if (res.success && res.url) {
            setUploadedFileUrl(res.url)
            setUploadProgress(100)
            setUploadError(null)
          } else {
            setUploadError(res.error || 'Upload failed.')
            setUploadProgress(0)
          }
        } catch {
          setUploadError('Failed to parse upload server response.')
          setUploadProgress(0)
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText)
          setUploadError(res.error || `Upload failed (Status ${xhr.status})`)
        } catch {
          setUploadError(`Upload failed (Status ${xhr.status})`)
        }
        setUploadProgress(0)
      }
    }

    xhr.onerror = () => {
      activeUploadXhrRef.current = null
      setIsUploading(false)
      setUploadError('Network error while uploading file. Please check connection.')
      setUploadProgress(0)
    }

    xhr.onabort = () => {
      activeUploadXhrRef.current = null
      setIsUploading(false)
      setUploadProgress(0)
    }

    xhr.open('POST', '/api/upload-resource')
    xhr.send(formData)
  }

  const cancelUpload = () => {
    if (activeUploadXhrRef.current) {
      activeUploadXhrRef.current.abort()
      activeUploadXhrRef.current = null
    }
    setIsUploading(false)
    setUploadProgress(0)
    setUploadBytesStatus('')
    setUploadedFileUrl('')
    setUploadedFileName('')
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    if (isUploading) {
      setError('Please wait for the file to finish uploading before saving.')
      setIsPending(false)
      return
    }

    if (storageType === 'supabase_file' && !uploadedFileUrl) {
      setError('Please select a file to upload.')
      setIsPending(false)
      return
    }
    
    const formData = new FormData(e.currentTarget)
    if (uploadedFileUrl) {
      formData.set('file_url', uploadedFileUrl)
    }
    
    let result
    if (initialData?.id) {
      formData.append('id', initialData.id)
      result = await updateSkillResource(formData)
    } else {
      result = await createSkillResource(formData)
    }

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/skill-resources" 
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {initialData ? 'Edit Skill Resource' : 'Upload Skill Resource'}
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-900/50 text-red-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-xl">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Target Skill Path <span className="text-red-400">*</span></label>
            <select 
              name="skill_id" 
              value={selectedSkillId} 
              onChange={e => setSelectedSkillId(e.target.value)} 
              required 
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">Select Skill Path</option>
              {skills.map(sk => (
                <option key={sk.id} value={sk.id}>
                  {sk.name} {sk.difficulty_level ? `(${sk.difficulty_level})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Title <span className="text-red-400">*</span></label>
            <input 
              name="title" 
              defaultValue={initialData?.title} 
              required 
              placeholder="e.g. Complete DSA Roadmap 2026"
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Description</label>
            <textarea 
              name="description" 
              defaultValue={initialData?.description} 
              rows={2}
              placeholder="Brief summary or instructions..."
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Resource Category <span className="text-red-400">*</span></label>
              <select 
                name="type" 
                defaultValue={initialData?.type || 'roadmap'} 
                required 
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="roadmap">Roadmap</option>
                <option value="notes">Notes & Cheatsheets</option>
                <option value="playlist">Playlists & Videos</option>
                <option value="project">Projects</option>
                <option value="article">Articles & Docs</option>
                <option value="resource">Other Resources</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Storage Type <span className="text-red-400">*</span></label>
              <select 
                name="storage_type" 
                value={storageType}
                onChange={e => setStorageType(e.target.value)}
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="supabase_file">File Upload (PDF / Document)</option>
                <option value="google_drive">Google Drive Link</option>
                <option value="youtube">YouTube Video / Playlist Link</option>
                <option value="external_link">External Web Link</option>
              </select>
            </div>
          </div>

          {storageType === 'supabase_file' && (
            <div className="space-y-4">
              {/* 1. Upload in Progress with Progress Bar */}
              {isUploading && (
                <div className="p-5 rounded-2xl bg-zinc-900/90 border border-indigo-500/40 backdrop-blur-xl space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl animate-pulse">
                        <Loader2 size={24} className="animate-spin" />
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm truncate max-w-xs sm:max-w-md">
                          {uploadedFileName || 'Uploading file...'}
                        </div>
                        <div className="text-xs text-indigo-400 font-mono mt-0.5">
                          {uploadBytesStatus || `${uploadProgress}% uploading...`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={cancelUpload}
                      className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                      title="Cancel Upload"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-zinc-800">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-150 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                      style={{ width: `${Math.max(uploadProgress, 4)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 2. Upload Error with Retry */}
              {uploadError && !isUploading && (
                <div className="p-4 rounded-xl bg-red-950/50 border border-red-900/50 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5 text-red-400">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                </div>
              )}

              {/* 3. Uploaded File Ready State */}
              {uploadedFileUrl && !isUploading && (
                <div className="p-5 rounded-2xl bg-zinc-900/90 border border-emerald-500/40 backdrop-blur-xl flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                      <FileText size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm flex items-center gap-2">
                        <span className="truncate max-w-[200px] sm:max-w-sm md:max-w-md">
                          {uploadedFileName || 'Uploaded Resource File'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase tracking-wider">
                          <CheckCircle2 size={12} /> Ready
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                        <a
                          href={uploadedFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                        >
                          View Uploaded Document
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-medium px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg transition-colors"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={cancelUpload}
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                      title="Remove File"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Dropzone for initial file selection */}
              {!uploadedFileUrl && !isUploading && (
                <label
                  htmlFor="skill-dropzone-file"
                  className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-zinc-950/50 hover:bg-zinc-900/80 hover:border-indigo-500/50 transition-all p-6 group"
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all mb-3 text-indigo-400">
                      <UploadCloud size={28} />
                    </div>
                    <p className="mb-1 text-sm text-zinc-300">
                      <span className="font-semibold text-indigo-400">Click to choose file</span> or drag & drop
                    </p>
                    <p className="text-xs text-zinc-500">Supports PDF, DOCX, ZIP, PPTX (Max 50MB)</p>
                  </div>
                </label>
              )}

              <input 
                ref={fileInputRef}
                id="skill-dropzone-file" 
                type="file" 
                accept=".pdf,.docx,.doc,.zip,.pptx,.ppt,.jpg,.jpeg,.png,.txt"
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files?.[0]) uploadFileWithProgress(e.target.files[0])
                }}
              />
            </div>
          )}

          {storageType === 'google_drive' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Google Drive URL</label>
              <input 
                name="drive_url" 
                type="url" 
                defaultValue={initialData?.drive_url} 
                placeholder="https://drive.google.com/..." 
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          )}

          {storageType === 'youtube' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">YouTube Video/Playlist URL</label>
              <input 
                name="youtube_url" 
                type="url" 
                defaultValue={initialData?.youtube_url} 
                placeholder="https://youtube.com/watch?v=..." 
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          )}

          {storageType === 'external_link' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">External URL</label>
              <input 
                name="external_url" 
                type="url" 
                defaultValue={initialData?.external_url} 
                placeholder="https://example.com/docs..." 
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Sort Order</label>
              <input 
                name="sort_order" 
                type="number" 
                defaultValue={initialData?.sort_order || 0} 
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="is_active" 
                  defaultChecked={initialData ? initialData.is_active : true} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-3 text-sm font-medium text-zinc-300">Active Status</span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800/50 flex justify-end gap-3">
          <Link 
            href="/dashboard/skill-resources" 
            className="px-5 py-2.5 rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800 font-medium transition-colors"
          >
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {isPending ? 'Saving...' : (initialData ? 'Update Resource' : 'Save Resource')}
          </button>
        </div>
      </form>
    </div>
  )
}
