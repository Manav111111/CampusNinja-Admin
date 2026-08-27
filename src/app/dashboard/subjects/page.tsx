import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, BookOpen, Layers, Sparkles } from 'lucide-react'
import SubjectsTable from './SubjectsTable'

export default async function SubjectsPage() {
  const supabase = await createAdminClient()
  
  // 1. Fetch all master subjects (with graceful fallback before migration)
  let allSubjects: any[] = []
  const { data: subjects, error: bsError } = await supabase
    .from('subjects')
    .select('*, branch_subjects(id, branch_id, semester_id, branches(name, short_code), semesters(number))')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (bsError || !subjects) {
    // Fallback: Query subjects directly and format legacy branch/semester as offering
    const { data: legacySubjects } = await supabase
      .from('subjects')
      .select('*, branches(name, short_code), semesters(number)')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    allSubjects = (legacySubjects || []).map(s => {
      const legacyOfferings = s.branch_id && s.semester_id ? [{
        id: `legacy_${s.id}`,
        branch_id: s.branch_id,
        semester_id: s.semester_id,
        branches: s.branches,
        semesters: s.semesters
      }] : []

      return {
        ...s,
        branch_subjects: legacyOfferings
      }
    })
  } else {
    allSubjects = subjects
  }
  
  // Calculate summary counts from unique master subjects
  const uniqueNames = new Set(allSubjects.map(s => (s.name || '').trim().toLowerCase()))
  const uniqueMasterSubjects = Array.from(uniqueNames).map(nameKey => {
    return allSubjects.find(s => (s.name || '').trim().toLowerCase() === nameKey)!
  }).filter(Boolean)

  const totalCount = uniqueMasterSubjects.length
  const theoryCount = uniqueMasterSubjects.filter(s => (s.category || '').toLowerCase() === 'theory').length
  const practicalCount = uniqueMasterSubjects.filter(s => (s.category || '').toLowerCase() === 'practical').length
  const electiveCount = uniqueMasterSubjects.filter(s => (s.category || '').toLowerCase() === 'elective').length

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Subject Library</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Master Catalog
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Central repository of all academic subjects. Define a subject once, then assign it across branches and semesters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/branches" 
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-zinc-800"
          >
            <Layers size={16} />
            Branch Assignments
          </Link>
          <Link 
            href="/dashboard/subjects/new" 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus size={18} />
            Add Master Subject
          </Link>
        </div>
      </div>

      {/* Quick Stat Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl">
          <div className="text-xs font-medium text-zinc-400">Total Master Subjects</div>
          <div className="text-2xl font-bold text-white mt-1">{totalCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl">
          <div className="text-xs font-medium text-blue-400">Theory Subjects</div>
          <div className="text-2xl font-bold text-white mt-1">{theoryCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl">
          <div className="text-xs font-medium text-emerald-400">Practical / Labs</div>
          <div className="text-2xl font-bold text-white mt-1">{practicalCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl">
          <div className="text-xs font-medium text-purple-400">Electives / Audit</div>
          <div className="text-2xl font-bold text-white mt-1">{electiveCount}</div>
        </div>
      </div>

      {/* Interactive Subjects Table */}
      <SubjectsTable subjects={allSubjects} />
    </div>
  )
}
