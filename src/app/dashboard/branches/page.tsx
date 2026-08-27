import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Edit2, Layers, ChevronRight, GraduationCap } from 'lucide-react'
import { deleteBranch } from './actions'
import { DeleteButton } from '@/components/DeleteButton'

export default async function BranchesPage() {
  const supabase = await createAdminClient()
  
  // 1. Fetch branches with semesters and branch_subjects (graceful fallback if table not created yet)
  let branchList: any[] = []
  const { data: branches, error: bsError } = await supabase
    .from('branches')
    .select('*, semesters(id, number), branch_subjects(id, subject_id)')
    .order('name')

  if (bsError || !branches) {
    // Fallback query before migration is applied
    const { data: plainBranches } = await supabase
      .from('branches')
      .select('*, semesters(id, number), subjects(id)')
      .order('name')
    
    branchList = (plainBranches || []).map(b => ({
      ...b,
      branch_subjects: b.subjects || []
    }))
  } else {
    branchList = branches
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Engineering Branches</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage academic programs, semesters, and subject assignments across all engineering disciplines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/subjects" 
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-zinc-800"
          >
            <Layers size={16} />
            Subject Library
          </Link>
          <Link 
            href="/dashboard/branches/new" 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus size={18} />
            Add Branch
          </Link>
        </div>
      </div>

      {/* Branches Table */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/60 text-xs uppercase text-zinc-400 border-b border-zinc-800/50">
              <tr>
                <th className="px-6 py-4 font-medium">Branch Program</th>
                <th className="px-6 py-4 font-medium">Code</th>
                <th className="px-6 py-4 font-medium">Semesters</th>
                <th className="px-6 py-4 font-medium">Assigned Subjects</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {branchList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    <GraduationCap size={32} className="mx-auto mb-2 opacity-30" />
                    No branches found. Create one to get started.
                  </td>
                </tr>
              ) : (
                branchList.map((branch) => {
                  const semesterCount = branch.semesters?.length || 0
                  const subjectCount = branch.branch_subjects?.length || 0

                  return (
                    <tr key={branch.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <Link 
                          href={`/dashboard/branches/${branch.id}`}
                          className="font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2"
                        >
                          {branch.name}
                          <ChevronRight size={14} className="text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-mono font-bold text-zinc-200 border border-zinc-700">
                          {branch.short_code}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-zinc-300 font-medium text-xs">
                          {semesterCount} {semesterCount === 1 ? 'Semester' : 'Semesters'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/branches/${branch.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                        >
                          <Layers size={13} />
                          {subjectCount} {subjectCount === 1 ? 'Subject' : 'Subjects'}
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          branch.is_active 
                            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' 
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            href={`/dashboard/branches/${branch.id}`}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Manage Semesters & Subjects"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <form action={deleteBranch}>
                            <input type="hidden" name="id" value={branch.id} />
                            <DeleteButton confirmMessage={`Are you sure you want to delete ${branch.name}? All related semesters and offerings will be removed.`} />
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
