'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { createSubject, updateSubject } from '@/app/dashboard/subjects/actions'

export default function SubjectForm({ 
  initialData,
  branches = [],
  semesters = []
}: { 
  initialData?: any,
  branches?: { id: string, name: string }[],
  semesters?: { id: string, branch_id: string, number: number }[]
}) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedBranch, setSelectedBranch] = useState(initialData?.branch_id || '')
  
  const isAllBranches = selectedBranch === 'ALL'
  const filteredSemesters = semesters.filter(s => s.branch_id === selectedBranch)
  const uniqueSemesterNumbers = Array.from(new Set(semesters.map(s => s.number))).sort((a, b) => a - b)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    let result
    if (initialData?.id) {
      formData.append('id', initialData.id)
      result = await updateSubject(formData)
    } else {
      result = await createSubject(formData)
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
          href="/dashboard/subjects" 
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {initialData ? 'Edit Subject' : 'New Subject'}
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-900/50 text-red-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Subject Name <span className="text-red-400">*</span></label>
            <input 
              name="name" 
              defaultValue={initialData?.name} 
              required 
              placeholder="e.g. Data Structures"
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Short Name</label>
            <input 
              name="short_name" 
              defaultValue={initialData?.short_name} 
              placeholder="e.g. DSA"
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Branch <span className="text-red-400">*</span></label>
            <select 
              name="branch_id" 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              required 
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="" disabled>Select a branch</option>
              {!initialData && (
                <option value="ALL" className="font-semibold text-emerald-400">Apply to All Branches</option>
              )}
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Semester <span className="text-red-400">*</span></label>
            {isAllBranches ? (
              <select 
                name="target_semester_number" 
                required 
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
              >
                <option value="" disabled>Select a semester number</option>
                {uniqueSemesterNumbers.map(num => (
                  <option key={num} value={num}>Semester {num}</option>
                ))}
              </select>
            ) : (
              <select 
                name="semester_id" 
                defaultValue={initialData?.semester_id || ''} 
                required 
                disabled={!selectedBranch}
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none disabled:opacity-50"
              >
                <option value="" disabled>Select a semester</option>
                {filteredSemesters.map(sem => (
                  <option key={sem.id} value={sem.id}>Semester {sem.number}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Category <span className="text-red-400">*</span></label>
            <select 
              name="category" 
              defaultValue={initialData?.category || 'theory'} 
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="theory">Theory</option>
              <option value="practical">Practical</option>
              <option value="elective">Elective</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Description</label>
          <textarea 
            name="description" 
            defaultValue={initialData?.description} 
            rows={3}
            placeholder="Brief description of the subject..."
            className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-800/50">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Theme Color</label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                name="theme_color" 
                defaultValue={initialData?.theme_color || '#EA580C'} 
                className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <span className="text-xs text-zinc-500">Main Accent</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Accent Color</label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                name="accent_color" 
                defaultValue={initialData?.accent_color || '#FFEDD5'} 
                className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <span className="text-xs text-zinc-500">Secondary (Light)</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Sort Order</label>
            <input 
              type="number" 
              name="sort_order" 
              defaultValue={initialData?.sort_order || 0} 
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-zinc-800/50">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                name="is_active" 
                defaultChecked={initialData ? initialData.is_active : true} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm"></div>
            </div>
            <span className="text-sm font-medium text-zinc-300">Active / Visible</span>
          </label>

          <button 
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            {isPending ? 'Saving...' : (
              <>
                <Save size={18} />
                Save Subject
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
