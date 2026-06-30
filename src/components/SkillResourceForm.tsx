'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, UploadCloud } from 'lucide-react'
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Upload File</label>
              <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 transition-colors rounded-xl p-6 text-center">
                <UploadCloud className="mx-auto h-10 w-10 text-zinc-500 mb-2" />
                <input 
                  type="file" 
                  name="file_upload" 
                  className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
                {initialData?.file_url && (
                  <p className="text-xs text-zinc-500 mt-2 truncate">Current file: {initialData.file_url}</p>
                )}
                <input type="hidden" name="file_url" value={initialData?.file_url || ''} />
              </div>
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
