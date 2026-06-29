'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { createNotification } from '@/app/dashboard/notifications/actions'

export default function NotificationForm({ 
  branches = [], 
  semesters = [] 
}: { 
  branches?: { id: string, name: string }[], 
  semesters?: { id: string, branch_id: string, number: number }[] 
}) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedBranch, setSelectedBranch] = useState('')
  const filteredSemesters = semesters.filter(s => s.branch_id === selectedBranch)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await createNotification(formData)

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/notifications" 
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Send Notification
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
              required 
              placeholder="e.g. Server Maintenance"
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Message <span className="text-red-400">*</span></label>
            <textarea 
              name="message" 
              required 
              rows={4}
              placeholder="Enter your notification message here..."
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-zinc-800/50">
            <h3 className="text-sm font-medium text-zinc-300 mb-4">Target Audience (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Branch</label>
                <select 
                  name="target_branch_id"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Semester</label>
                <select 
                  name="target_semester_id" 
                  disabled={!selectedBranch}
                  className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none disabled:opacity-50"
                >
                  <option value="">All Semesters</option>
                  {filteredSemesters.map(sem => (
                    <option key={sem.id} value={sem.id}>Semester {sem.number}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end border-t border-zinc-800/50">
          <button 
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            {isPending ? 'Sending...' : (
              <>
                <Send size={18} />
                Send Notification
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
