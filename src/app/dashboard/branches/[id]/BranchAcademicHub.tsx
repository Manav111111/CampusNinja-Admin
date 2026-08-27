'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  BookOpen, 
  GraduationCap, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import SubjectAssignModal, { MasterSubjectItem, AssignedSubjectItem } from '@/components/SubjectAssignModal'
import { removeBranchSubjectAction, updateBranch } from '../actions'

interface BranchAcademicHubProps {
  branch: {
    id: string
    name: string
    short_code: string
    is_active: boolean
  }
  semesters: Array<{
    id: string
    branch_id: string
    number: number
    name?: string
    is_active?: boolean
  }>
  assignedSubjects: AssignedSubjectItem[]
  allMasterSubjects: MasterSubjectItem[]
}

export default function BranchAcademicHub({
  branch,
  semesters,
  assignedSubjects,
  allMasterSubjects,
}: BranchAcademicHubProps) {
  const [showEditBranch, setShowEditBranch] = useState(false)
  const [activeModalSemester, setActiveModalSemester] = useState<{
    id: string
    number: number
    name?: string
  } | null>(null)

  // Group assigned subjects by semester_id
  const subjectsBySemester: Record<string, AssignedSubjectItem[]> = {}
  semesters.forEach(s => {
    subjectsBySemester[s.id] = []
  })

  assignedSubjects.forEach(item => {
    if (subjectsBySemester[(item as any).semester_id]) {
      subjectsBySemester[(item as any).semester_id].push(item)
    }
  })

  const totalAssignedCount = assignedSubjects.length

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/branches" 
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">{branch.name}</h1>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                {branch.short_code}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                branch.is_active 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {branch.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Manage semester curriculum and academic offerings for this engineering discipline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowEditBranch(!showEditBranch)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Edit3 size={16} />
            {showEditBranch ? 'Hide Settings' : 'Edit Branch'}
          </button>

          <Link
            href="/dashboard/subjects/new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus size={16} />
            New Master Subject
          </Link>
        </div>
      </div>

      {/* Expandable Edit Branch Settings Form */}
      {showEditBranch && (
        <form 
          action={async (formData) => {
            await updateBranch(formData)
            setShowEditBranch(false)
          }}
          className="p-6 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-4 backdrop-blur-xl animate-in slide-in-from-top-2 duration-300"
        >
          <input type="hidden" name="id" value={branch.id} />
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Branch Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Branch Name</label>
              <input
                name="name"
                defaultValue={branch.name}
                required
                className="w-full rounded-xl px-4 py-2.5 bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Short Code</label>
              <input
                name="short_code"
                defaultValue={branch.short_code}
                required
                className="w-full rounded-xl px-4 py-2.5 bg-zinc-950 border border-zinc-800 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-300">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={branch.is_active}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-500/50"
              />
              Active Program
            </label>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Save Details
            </button>
          </div>
        </form>
      )}

      {/* Program Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl">
          <div className="text-xs font-medium text-zinc-400">Total Semesters</div>
          <div className="text-3xl font-bold text-white mt-1">{semesters.length}</div>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl">
          <div className="text-xs font-medium text-indigo-400">Subject Offerings Assigned</div>
          <div className="text-3xl font-bold text-white mt-1">{totalAssignedCount}</div>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl col-span-2 sm:col-span-1">
          <div className="text-xs font-medium text-emerald-400">Master Catalog Size</div>
          <div className="text-3xl font-bold text-white mt-1">{allMasterSubjects.length}</div>
        </div>
      </div>

      {/* Semesters & Assigned Subjects Hub */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers size={20} className="text-indigo-400" />
              Semester Curriculum
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Assign master subjects to each semester of {branch.name}.
            </p>
          </div>
        </div>

        {semesters.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30 text-zinc-500">
            <GraduationCap size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium text-zinc-300">No semesters found for this branch</p>
            <p className="text-xs text-zinc-500 mt-1">Please create semesters first in the Semesters tab.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {semesters.map((sem) => {
              const assigned = subjectsBySemester[sem.id] || []
              const count = assigned.length

              return (
                <div 
                  key={sem.id}
                  className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden backdrop-blur-xl transition-all"
                >
                  {/* Semester Row Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-zinc-950/40 border-b border-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-sm text-indigo-400">
                        {sem.number}
                      </div>
                      <div>
                        <div className="font-bold text-base text-white">
                          Semester {sem.number} {sem.name ? `— ${sem.name}` : ''}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {count === 0 ? (
                            <span className="text-zinc-500">No subjects assigned</span>
                          ) : (
                            <span>{count} {count === 1 ? 'subject' : 'subjects'} assigned</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setActiveModalSemester(sem)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
                      >
                        <Plus size={14} />
                        Assign Subjects
                      </button>
                    </div>
                  </div>

                  {/* Assigned Subjects Grid */}
                  <div className="p-5">
                    {count === 0 ? (
                      <div className="py-6 px-4 text-center border border-dashed border-zinc-800/80 rounded-xl bg-zinc-950/20">
                        <p className="text-xs text-zinc-400">No subjects assigned to Semester {sem.number} yet.</p>
                        <button
                          type="button"
                          onClick={() => setActiveModalSemester(sem)}
                          className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          <Plus size={13} />
                          Assign from Subject Library
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {assigned.map((item, idx) => {
                          const sub = item.subjects
                          if (!sub) return null

                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-xs font-mono font-semibold text-zinc-600 w-5">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                                <div
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: sub.theme_color || '#EA580C' }}
                                />
                                <div className="truncate">
                                  <Link
                                    href={`/dashboard/subjects/${sub.id}`}
                                    className="font-semibold text-xs text-white group-hover:text-indigo-400 transition-colors truncate block"
                                  >
                                    {sub.name}
                                  </Link>
                                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                                    {sub.short_name && (
                                      <span className="font-mono text-zinc-500 uppercase">{sub.short_name}</span>
                                    )}
                                    <span>•</span>
                                    <span className="capitalize">{sub.category || 'Theory'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <Link
                                  href={`/dashboard/subjects/${sub.id}`}
                                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                                  title="View Subject Details"
                                >
                                  <ExternalLink size={13} />
                                </Link>
                                <form action={removeBranchSubjectAction}>
                                  <input type="hidden" name="id" value={item.id} />
                                  <input type="hidden" name="branch_id" value={branch.id} />
                                  <button
                                    type="submit"
                                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                                    title="Remove from Semester"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </form>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {activeModalSemester && (
        <SubjectAssignModal
          isOpen={Boolean(activeModalSemester)}
          onClose={() => setActiveModalSemester(null)}
          branchId={branch.id}
          branchName={branch.name}
          semesterId={activeModalSemester.id}
          semesterNumber={activeModalSemester.number}
          allMasterSubjects={allMasterSubjects}
          currentAssigned={subjectsBySemester[activeModalSemester.id] || []}
        />
      )}
    </div>
  )
}
