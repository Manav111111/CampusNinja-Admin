'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, UploadCloud, FileText, CheckCircle2, Video, HardDrive, ExternalLink, X } from 'lucide-react'
import { createResource, updateResource } from '@/app/dashboard/resources/actions'

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function ResourceForm({ 
  initialData, 
  branches = [], 
  semesters = [], 
  subjects = [] 
}: { 
  initialData?: any, 
  branches?: { id: string, name: string }[], 
  semesters?: { id: string, branch_id: string, number: number }[], 
  subjects?: { id: string, semester_id: string, branch_id: string, name: string }[] 
}) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storageType, setStorageType] = useState(initialData?.storage_type || 'supabase_file')
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialData?.subject_id || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtube_url || '')

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)
  const youtubeVideoId = extractYouTubeId(youtubeUrl)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    if (storageType === 'supabase_file' && !initialData?.file_url && !selectedFile) {
      setError('Please select a file (PDF, DOCX, ZIP) to upload.')
      setIsPending(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    
    let result
    if (initialData?.id) {
      formData.append('id', initialData.id)
      result = await updateResource(formData)
    } else {
      result = await createResource(formData)
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
          href="/dashboard/resources" 
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {initialData ? 'Edit Resource' : 'Upload Academic Resource'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Fill in the details below to publish study materials instantly to students.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/80 border border-red-900 text-red-300 rounded-xl text-sm font-medium flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white"><X size={16} /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-xl">
        {initialData && (
          <>
            <input type="hidden" name="existing_file_url" value={initialData.file_url || ''} />
            <input type="hidden" name="existing_file_size" value={initialData.file_size || ''} />
            <input type="hidden" name="existing_file_format" value={initialData.file_format || ''} />
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-zinc-300">Resource Title <span className="text-red-400">*</span></label>
            <input 
              name="title" 
              defaultValue={initialData?.title} 
              required 
              placeholder="e.g., Module 1 Complete Notes & Solved Numericals"
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Subject <span className="text-red-400">*</span></label>
            <select 
              name="subject_id" 
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              required
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="" disabled>Select Subject...</option>
              {(() => {
                const seenSubjects = new Set<string>()
                return subjects.filter(sub => {
                  const sNum = (sub as any).semesters?.number || semesters.find(s => s.id === sub.semester_id)?.number || '?'
                  const key = `${sub.name.trim().toLowerCase()}_sem_${sNum}`
                  if (seenSubjects.has(key)) return false
                  seenSubjects.add(key)
                  return true
                }).map(sub => {
                  const sNum = (sub as any).semesters?.number || semesters.find(s => s.id === sub.semester_id)?.number || '?'
                  return (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} — (Sem {sNum})
                    </option>
                  )
                })
              })()}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Resource Category <span className="text-red-400">*</span></label>
            <select 
              name="type" 
              defaultValue={initialData?.type || 'notes'} 
              required
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="notes">Notes</option>
              <option value="pyq">PYQ (Past Year Question)</option>
              <option value="video">Video Lecture</option>
              <option value="syllabus">Syllabus</option>
              <option value="important_questions">Important Questions</option>
              <option value="ai_resources">AI Summaries / Cheat Sheets</option>
            </select>
          </div>
        </div>

        {selectedSubject && (
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="bg-indigo-900/60 text-indigo-200 px-3 py-1 rounded-full font-semibold">
                📍 Auto Branch: {(selectedSubject as any).branches?.name || branches.find(b => b.id === selectedSubject.branch_id)?.name || 'Detected'}
              </span>
              <span className="bg-purple-900/60 text-purple-200 px-3 py-1 rounded-full font-semibold">
                🎓 Semester: {(selectedSubject as any).semesters?.number || semesters.find(s => s.id === selectedSubject.semester_id)?.number || '1'}
              </span>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="apply_to_all_branches" 
                defaultChecked={true} 
                className="w-4 h-4 mt-0.5 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500" 
              />
              <div>
                <span className="text-sm font-semibold text-indigo-200 block">
                  Publish across all branches teaching "{selectedSubject.name}"
                </span>
                <span className="text-xs text-indigo-300/80">
                  Automatically links this resource to CS, IT, ECE, AI, etc. if they have "{selectedSubject.name}" in Sem {(selectedSubject as any).semesters?.number || semesters.find(s => s.id === selectedSubject.semester_id)?.number || '1'}.
                </span>
              </div>
            </label>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Description / Guidelines</label>
          <textarea 
            name="description" 
            defaultValue={initialData?.description} 
            rows={3}
            placeholder="Brief description or instructions for students..."
            className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Storage Location <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'supabase_file', label: 'Supabase File', icon: UploadCloud },
              { id: 'google_drive', label: 'Google Drive', icon: HardDrive },
              { id: 'youtube', label: 'YouTube Video', icon: Video },
              { id: 'external_link', label: 'External Link', icon: ExternalLink },
            ].map(tab => {
              const Icon = tab.icon
              const isSelected = storageType === tab.id
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setStorageType(tab.id)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <Icon size={16} className={isSelected ? 'text-indigo-400' : 'text-zinc-500'} />
                  {tab.label}
                </button>
              )
            })}
          </div>
          <input type="hidden" name="storage_type" value={storageType} />
        </div>

        <div className="p-6 rounded-xl border border-dashed border-zinc-700/60 bg-zinc-950/60">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
            {storageType === 'supabase_file' && <><UploadCloud size={18} className="text-indigo-400" /> Upload File to Supabase Storage</>}
            {storageType === 'google_drive' && <><HardDrive size={18} className="text-emerald-400" /> Google Drive Link Configuration</>}
            {storageType === 'youtube' && <><Video size={18} className="text-rose-400" /> YouTube Video Integration</>}
            {storageType === 'external_link' && <><ExternalLink size={18} className="text-amber-400" /> External Resource Link</>}
          </h3>
          
          {storageType === 'supabase_file' && (
            <div className="space-y-4">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-zinc-900/50 hover:bg-zinc-800/80 transition-all p-6">
                {selectedFile ? (
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400">
                      <FileText size={28} />
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        {selectedFile.name}
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">
                        Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                      </div>
                      <span className="text-xs text-indigo-400 underline mt-2 inline-block">Click to select a different file</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <UploadCloud className="w-10 h-10 mb-3 text-indigo-400" />
                    <p className="mb-1 text-sm text-zinc-300"><span className="font-semibold text-indigo-400">Click to choose file</span> or drag & drop</p>
                    <p className="text-xs text-zinc-500">Supports PDF, DOCX, ZIP, PPTX, JPG (Max 50MB)</p>
                  </div>
                )}
                <input 
                  id="dropzone-file" 
                  type="file" 
                  name="file_upload" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0])
                  }}
                />
              </label>

              {initialData?.file_url && !selectedFile && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                  <span className="text-zinc-300 truncate max-w-[70%]">
                    📁 Current File: <a href={initialData.file_url} target="_blank" rel="noreferrer" className="text-indigo-400 underline ml-1">{initialData.file_url.split('/').pop()}</a>
                  </span>
                  <span className="text-zinc-500">{initialData.file_size} ({initialData.file_format})</span>
                </div>
              )}
            </div>
          )}

          {storageType === 'google_drive' && (
            <div className="space-y-2">
              <input 
                name="drive_url" 
                defaultValue={initialData?.drive_url} 
                placeholder="https://drive.google.com/file/d/..." 
                className="w-full rounded-lg px-4 py-3 bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50" 
              />
              <p className="text-xs text-zinc-400">
                💡 Note: Make sure sharing access is set to <span className="text-emerald-400 font-medium">"Anyone with the link can view"</span> on Google Drive.
              </p>
            </div>
          )}

          {storageType === 'youtube' && (
            <div className="space-y-4">
              <input 
                name="youtube_url" 
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..." 
                className="w-full rounded-lg px-4 py-3 bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50" 
              />
              {youtubeVideoId && (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <img 
                    src={`https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`} 
                    alt="Video Thumbnail Preview" 
                    className="w-28 h-16 object-cover rounded-lg bg-zinc-950"
                  />
                  <div>
                    <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Video ID Detected: {youtubeVideoId}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      High-res thumbnail will be automatically generated and displayed as a preview card inside the app.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {storageType === 'external_link' && (
            <div className="space-y-2">
              <input 
                name="external_url" 
                defaultValue={initialData?.external_url} 
                placeholder="https://example.com/study-material" 
                className="w-full rounded-lg px-4 py-3 bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50" 
              />
              <p className="text-xs text-zinc-400">
                Students will be able to open this web link directly inside the app browser.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Sort Order / Priority</label>
            <input 
              type="number" 
              name="sort_order" 
              defaultValue={initialData?.sort_order || 0} 
              className="w-full rounded-lg px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-sm"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" name="is_active" defaultChecked={initialData ? initialData.is_active : true} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm"></div>
              </div>
              <span className="text-sm font-medium text-zinc-300">Active & Visible in App</span>
            </label>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end border-t border-zinc-800/50">
          <button 
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            {isPending ? 'Publishing Resource...' : (
              <><Save size={18} /> {initialData ? 'Update Resource' : 'Publish Resource'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

