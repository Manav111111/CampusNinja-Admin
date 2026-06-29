'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, UploadCloud } from 'lucide-react'
import { createResource, updateResource } from '@/app/dashboard/resources/actions'

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

  // Find initial branch and semester based on initial subject
  const initialSubject = subjects.find(s => s.id === initialData?.subject_id)
  const initialSemesterId = initialSubject?.semester_id || ''
  const initialBranchId = initialSubject?.branch_id || ''

  const [selectedBranch, setSelectedBranch] = useState(initialBranchId)
  const [selectedSemester, setSelectedSemester] = useState(initialSemesterId)

  const filteredSemesters = semesters.filter(s => s.branch_id === selectedBranch)
  const filteredSubjects = subjects.filter(s => s.semester_id === selectedSemester)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
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
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {initialData ? 'Edit Resource' : 'Upload Resource'}
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
            <label className="text-sm font-medium text-zinc-300">Title <span className="text-red-400">*</span></label>
            <input 
              name="title" 
              defaultValue={initialData?.title} 
              required 
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Branch <span className="text-red-400">*</span></label>
              <select 
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value)
                  setSelectedSemester('') // reset downstream
                }}
                required
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 appearance-none"
              >
                <option value="" disabled>Select Branch...</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Semester <span className="text-red-400">*</span></label>
              <select 
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                required
                disabled={!selectedBranch}
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 appearance-none disabled:opacity-50"
              >
                <option value="" disabled>Select Semester...</option>
                {filteredSemesters.map(sem => (
                  <option key={sem.id} value={sem.id}>Semester {sem.number}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Subject <span className="text-red-400">*</span></label>
              <select 
                name="subject_id" 
                defaultValue={initialData?.subject_id || ''} 
                required
                disabled={!selectedSemester}
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 appearance-none disabled:opacity-50"
              >
                <option value="" disabled>Select Subject...</option>
                {filteredSubjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>


          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Resource Type <span className="text-red-400">*</span></label>
            <select 
              name="type" 
              defaultValue={initialData?.type || 'notes'} 
              required
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="notes">Notes</option>
              <option value="pyq">PYQ (Past Year Question)</option>
              <option value="video">Video</option>
              <option value="syllabus">Syllabus</option>
              <option value="important_questions">Important Questions</option>
              <option value="ai_resources">AI Resources</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Storage Location <span className="text-red-400">*</span></label>
            <select 
              name="storage_type" 
              value={storageType}
              onChange={(e) => setStorageType(e.target.value)}
              required
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="supabase_file">Supabase Storage</option>
              <option value="google_drive">Google Drive</option>
              <option value="youtube">YouTube</option>
              <option value="external_link">External Link</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Description</label>
          <textarea 
            name="description" 
            defaultValue={initialData?.description} 
            rows={3}
            className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 resize-none"
          />
        </div>

        <div className="p-6 rounded-xl border border-dashed border-zinc-700/50 bg-zinc-950/50">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">File Configuration</h3>
          
          {storageType === 'supabase_file' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-800 border-dashed rounded-lg cursor-pointer bg-zinc-900/50 hover:bg-zinc-800 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-3 text-zinc-400" />
                    <p className="mb-2 text-sm text-zinc-400"><span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-zinc-500">PDF, DOCX, ZIP (Max 50MB)</p>
                  </div>
                  <input id="dropzone-file" type="file" name="file_upload" className="hidden" />
                </label>
              </div>
              {initialData?.file_url && (
                <div className="text-xs text-emerald-400">Current file: {initialData.file_url.split('/').pop()}</div>
              )}
            </div>
          )}

          {storageType === 'google_drive' && (
            <input name="drive_url" defaultValue={initialData?.drive_url} placeholder="Google Drive Link" className="w-full rounded-lg px-4 py-3 bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50" />
          )}

          {storageType === 'youtube' && (
            <input name="youtube_url" defaultValue={initialData?.youtube_url} placeholder="YouTube Video URL" className="w-full rounded-lg px-4 py-3 bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50" />
          )}

          {storageType === 'external_link' && (
            <input name="external_url" defaultValue={initialData?.external_url} placeholder="External URL" className="w-full rounded-lg px-4 py-3 bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50" />
          )}
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-zinc-800/50">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" name="is_active" defaultChecked={initialData ? initialData.is_active : true} className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm"></div>
            </div>
            <span className="text-sm font-medium text-zinc-300">Active / Visible</span>
          </label>

          <button 
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            {isPending ? 'Uploading...' : (
              <><Save size={18} /> Save Resource</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
