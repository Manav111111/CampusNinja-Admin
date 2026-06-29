import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Edit2 } from 'lucide-react'
import { deleteSubject } from './actions'
import { DeleteButton } from '@/components/DeleteButton'

export default async function SubjectsPage() {
  const supabase = await createAdminClient()
  
  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('*, branches(name, short_code), semesters(number)')
    .order('sort_order')

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Subjects</h1>
        <Link 
          href="/dashboard/subjects/new" 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Subject
        </Link>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-400 border-b border-zinc-800/50">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Branch</th>
                <th className="px-6 py-4 font-medium">Semester</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {!subjects?.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No subjects found. Create one to get started.
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full shadow-lg" 
                          style={{ backgroundColor: subject.theme_color || '#EA580C' }}
                        />
                        <div>
                          <div className="font-semibold text-white">{subject.name}</div>
                          <div className="text-xs text-zinc-500">{subject.short_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-300">{(subject as any).branches?.name}</div>
                      <div className="text-xs text-zinc-500">{(subject as any).branches?.short_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-zinc-700">
                        Semester {(subject as any).semesters?.number}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize">{subject.category}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        subject.is_active 
                          ? 'bg-emerald-400/10 text-emerald-400' 
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {subject.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/dashboard/subjects/${subject.id}`}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <form action={deleteSubject}>
                          <input type="hidden" name="id" value={subject.id} />
                          <DeleteButton confirmMessage="Are you sure you want to delete this subject?" />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
