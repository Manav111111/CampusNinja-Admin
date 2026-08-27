'use client'

import { useState, useTransition } from 'react'
import { Plus, Check, AlertCircle } from 'lucide-react'
import { assignSubjectOffering } from '../actions'

interface OfferingAssignerProps {
  subjectId: string
  branches: { id: string; name: string; short_code?: string }[]
  semesters: { id: string; branch_id: string; number: number; name?: string }[]
}

export default function OfferingAssigner({
  subjectId,
  branches,
  semesters,
}: OfferingAssignerProps) {
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const filteredSemesters = selectedBranch
    ? semesters.filter(s => s.branch_id === selectedBranch)
    : []

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBranch || !selectedSemester) {
      setError('Please select both a Branch and Semester.')
      return
    }

    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.set('subject_id', subjectId)
    formData.set('branch_id', selectedBranch)
    formData.set('semester_id', selectedSemester)

    startTransition(async () => {
      const res = await assignSubjectOffering(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        setSelectedBranch('')
        setSelectedSemester('')
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <div className="border-t border-zinc-800/80 pt-6 space-y-4">
      <div className="flex items-center gap-2">
        <Plus size={16} className="text-indigo-400" />
        <h3 className="text-sm font-semibold text-zinc-200">Assign to Another Branch & Semester</h3>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-900/40 text-red-400 text-xs">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 text-xs">
          <Check size={14} />
          <span>Offering successfully assigned!</span>
        </div>
      )}

      <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Target Branch</label>
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value)
              setSelectedSemester('')
            }}
            className="w-full rounded-xl px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="">Select Branch...</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.short_code ? `(${b.short_code})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            disabled={!selectedBranch}
            className="w-full rounded-xl px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-40"
          >
            <option value="">Select Semester...</option>
            {filteredSemesters.map((s) => (
              <option key={s.id} value={s.id}>
                Semester {s.number} {s.name ? `- ${s.name}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            type="submit"
            disabled={isPending || !selectedBranch || !selectedSemester}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl font-medium text-xs transition-colors shadow-sm"
          >
            <Plus size={14} />
            {isPending ? 'Assigning...' : 'Add Offering'}
          </button>
        </div>
      </form>
    </div>
  )
}
