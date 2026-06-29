'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { createSkill, updateSkill } from '@/app/dashboard/skills/actions'

export default function SkillForm({ initialData }: { initialData?: any }) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    let result
    if (initialData?.id) {
      formData.append('id', initialData.id)
      result = await updateSkill(formData)
    } else {
      result = await createSkill(formData)
    }

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/skills" 
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {initialData ? 'Edit Skill Path' : 'New Skill Path'}
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-900/50 text-red-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-zinc-300">Name <span className="text-red-400">*</span></label>
            <input 
              name="name" 
              defaultValue={initialData?.name} 
              required 
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Difficulty <span className="text-red-400">*</span></label>
            <select 
              name="difficulty_level" 
              defaultValue={initialData?.difficulty_level || 'beginner'} 
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Sort Order</label>
            <input 
              type="number" 
              name="sort_order" 
              defaultValue={initialData?.sort_order || 0} 
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50"
            />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/50">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Theme Color</label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                name="theme_color" 
                defaultValue={initialData?.theme_color || '#3B82F6'} 
                className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Accent Color</label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                name="accent_color" 
                defaultValue={initialData?.accent_color || '#DBEAFE'} 
                className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
              />
            </div>
          </div>
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
            {isPending ? 'Saving...' : (
              <><Save size={18} /> Save Skill</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
