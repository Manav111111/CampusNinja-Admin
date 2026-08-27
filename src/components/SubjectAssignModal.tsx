'use client'

import { useState, useMemo, useTransition } from 'react'
import { 
  X, 
  Search, 
  Check, 
  Plus, 
  Trash2, 
  BookOpen, 
  Layers, 
  Sparkles, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { assignSubjectsToSemesterAction } from '@/app/dashboard/branches/actions'

export interface MasterSubjectItem {
  id: string
  name: string
  short_name?: string
  category?: string
  theme_color?: string
  is_active: boolean
}

export interface AssignedSubjectItem {
  id: string // branch_subject id
  subject_id: string
  sort_order: number
  subjects?: MasterSubjectItem
}

interface SubjectAssignModalProps {
  isOpen: boolean
  onClose: () => void
  branchId: string
  branchName: string
  semesterId: string
  semesterNumber: number
  allMasterSubjects: MasterSubjectItem[]
  currentAssigned: AssignedSubjectItem[]
}

export default function SubjectAssignModal({
  isOpen,
  onClose,
  branchId,
  branchName,
  semesterId,
  semesterNumber,
  allMasterSubjects,
  currentAssigned,
}: SubjectAssignModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Track the set of subject_ids currently assigned in this modal state
  const initialAssignedSubjectIds = useMemo(() => {
    return new Set(currentAssigned.map(a => a.subject_id))
  }, [currentAssigned])

  const [activeSubjectIds, setActiveSubjectIds] = useState<Set<string>>(
    () => new Set(initialAssignedSubjectIds)
  )

  // Reset modal state when opened/closed or props change
  const handleOpenReset = () => {
    setActiveSubjectIds(new Set(initialAssignedSubjectIds))
    setSearchTerm('')
    setCategoryFilter('ALL')
    setError(null)
  }

  // Deduplicate all master subjects by unique name
  const uniqueMasterSubjects = useMemo(() => {
    const seen = new Set<string>()
    const list: MasterSubjectItem[] = []
    allMasterSubjects.forEach(s => {
      const key = (s.name || '').trim().toLowerCase()
      if (!key || seen.has(key)) return
      seen.add(key)
      list.push(s)
    })
    return list
  }, [allMasterSubjects])

  // Master subjects map for fast lookup
  const masterSubjectMap = useMemo(() => {
    const map = new Map<string, MasterSubjectItem>()
    allMasterSubjects.forEach(s => map.set(s.id, s))
    return map
  }, [allMasterSubjects])

  // Set of normalized names of currently assigned subjects
  const assignedNames = useMemo(() => {
    const names = new Set<string>()
    activeSubjectIds.forEach(id => {
      const s = masterSubjectMap.get(id)
      if (s?.name) names.add(s.name.trim().toLowerCase())
    })
    return names
  }, [activeSubjectIds, masterSubjectMap])

  // Split subjects into Assigned vs Available
  const assignedList = useMemo(() => {
    const seen = new Set<string>()
    const list: MasterSubjectItem[] = []
    Array.from(activeSubjectIds).forEach(id => {
      const s = masterSubjectMap.get(id)
      if (s) {
        const key = s.name.trim().toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          list.push(s)
        }
      }
    })
    return list
  }, [activeSubjectIds, masterSubjectMap])

  const availableList = useMemo(() => {
    return uniqueMasterSubjects
      .filter(s => !assignedNames.has(s.name.trim().toLowerCase()))
      .filter(s => {
        const matchesSearch = 
          !searchTerm || 
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (s.short_name && s.short_name.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesCat = 
          categoryFilter === 'ALL' || 
          (s.category || '').toLowerCase() === categoryFilter.toLowerCase()

        return matchesSearch && matchesCat
      })
  }, [uniqueMasterSubjects, assignedNames, searchTerm, categoryFilter])

  // Toggle subject assignment in local state
  const toggleSubject = (subjectId: string) => {
    setActiveSubjectIds(prev => {
      const next = new Set(prev)
      if (next.has(subjectId)) {
        next.delete(subjectId)
      } else {
        next.add(subjectId)
      }
      return next
    })
  }

  // Save changes
  const handleSave = () => {
    setError(null)

    const subjectIdsToAdd = Array.from(activeSubjectIds).filter(
      id => !initialAssignedSubjectIds.has(id)
    )
    const subjectIdsToRemove = Array.from(initialAssignedSubjectIds).filter(
      id => !activeSubjectIds.has(id)
    )

    if (subjectIdsToAdd.length === 0 && subjectIdsToRemove.length === 0) {
      onClose()
      return
    }

    startTransition(async () => {
      const res = await assignSubjectsToSemesterAction(
        branchId,
        semesterId,
        subjectIdsToAdd,
        subjectIdsToRemove
      )

      if (res?.error) {
        setError(res.error)
      } else {
        onClose()
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div>
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Assign Subjects</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              <span className="text-zinc-200 font-semibold">{branchName}</span> • Semester {semesterNumber}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-900/40 text-red-400 text-xs">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Controls */}
        <div className="p-5 border-b border-zinc-800/80 space-y-3 bg-zinc-900/30">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search subject library (e.g. Applied Physics, DSA)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['ALL', 'theory', 'practical', 'elective'].map((cat) => {
              const isSelected = categoryFilter === cat
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg border font-medium capitalize whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Subjects' : cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Scrollable Content: Assigned vs Available */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* SECTION 1: Currently Assigned */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Currently Assigned ({assignedList.length})
              </h3>
              <span className="text-[11px] text-zinc-500">Click &quot;Remove&quot; to unassign</span>
            </div>

            {assignedList.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20 text-xs text-zinc-500">
                No subjects assigned to Semester {semesterNumber} yet. Pick from available subjects below.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {assignedList.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 group hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: subject.theme_color || '#EA580C' }}
                      />
                      <div className="truncate">
                        <div className="font-semibold text-xs text-white truncate">{subject.name}</div>
                        <div className="text-[10px] text-zinc-400 capitalize">{subject.category || 'Theory'}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSubject(subject.id)}
                      className="px-2 py-1 rounded-md text-[11px] font-medium text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: Available Subjects from Master Library */}
          <div className="space-y-3 border-t border-zinc-800/80 pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={14} className="text-indigo-400" />
                Available from Subject Library ({availableList.length})
              </h3>
              <span className="text-[11px] text-zinc-500">Click &quot;+ Add&quot; to assign</span>
            </div>

            {availableList.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20 text-xs text-zinc-500">
                {searchTerm 
                  ? 'No matching subjects found for your search.' 
                  : 'All master subjects are currently assigned to this semester.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableList.map((subject) => (
                  <div
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 hover:border-indigo-500/50 hover:bg-zinc-950/80 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 opacity-70 group-hover:opacity-100"
                        style={{ backgroundColor: subject.theme_color || '#EA580C' }}
                      />
                      <div className="truncate">
                        <div className="font-medium text-xs text-zinc-200 group-hover:text-white truncate">
                          {subject.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 capitalize">{subject.category || 'Theory'}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0"
                    >
                      <Plus size={12} />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-950/60">
          <div className="text-xs text-zinc-400">
            <span className="font-semibold text-white">{assignedList.length}</span> subjects assigned to Sem {semesterNumber}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl font-medium text-xs transition-all shadow-lg shadow-indigo-600/20"
            >
              <Check size={14} />
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
