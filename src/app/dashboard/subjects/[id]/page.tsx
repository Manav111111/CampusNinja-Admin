import { createAdminClient } from '@/utils/supabase/server'
import SubjectForm from '@/components/SubjectForm'
import { notFound } from 'next/navigation'
import { Layers, Plus, Trash2, GraduationCap, MapPin, Sparkles } from 'lucide-react'
import { assignSubjectOffering, removeSubjectOffering } from '../actions'
import { DeleteButton } from '@/components/DeleteButton'
import OfferingAssigner from './OfferingAssigner'

export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const supabase = await createAdminClient()
  
  const [subjectRes, branchesRes, semestersRes] = await Promise.all([
    supabase.from('subjects').select('*').eq('id', resolvedParams.id).single(),
    supabase.from('branches').select('id, name, short_code').order('name'),
    supabase.from('semesters').select('id, branch_id, number, name').order('number')
  ])

  if (subjectRes.error || !subjectRes.data) {
    notFound()
  }

  const subject = subjectRes.data

  // Fetch current branch offerings from branch_subjects
  let offerings: any[] = []
  try {
    const { data: bsData, error: bsError } = await supabase
      .from('branch_subjects')
      .select('id, sort_order, is_active, branches(id, name, short_code), semesters(id, number, name)')
      .eq('subject_id', subject.id)
      .order('sort_order', { ascending: true })

    if (!bsError && bsData && bsData.length > 0) {
      offerings = bsData
    } else if (subject.branch_id && subject.semester_id) {
      // Legacy fallback
      const [legBranch, legSem] = await Promise.all([
        supabase.from('branches').select('id, name, short_code').eq('id', subject.branch_id).single(),
        supabase.from('semesters').select('id, number, name').eq('id', subject.semester_id).single()
      ])
      if (legBranch.data && legSem.data) {
        offerings = [{
          id: `legacy_${subject.id}`,
          sort_order: subject.sort_order || 0,
          is_active: subject.is_active,
          branches: legBranch.data,
          semesters: legSem.data
        }]
      }
    }
  } catch (err) {
    console.warn('branch_subjects query fallback:', err)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      {/* 1. Master Subject Definition Form */}
      <SubjectForm initialData={subject} />

      {/* 2. Academic Offerings & Branch Assignments */}
      <div id="offerings" className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers size={20} className="text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Academic Offerings</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Where is <span className="font-semibold text-zinc-200">{subject.name}</span> currently taught across engineering programs?
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {offerings.length} {offerings.length === 1 ? 'Offering' : 'Offerings'} Active
            </span>
          </div>
        </div>

        {/* Existing Offerings List */}
        {offerings.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30 space-y-2">
            <GraduationCap size={32} className="mx-auto text-zinc-600 mb-2" />
            <p className="text-sm font-medium text-zinc-300">Not assigned to any branch or semester yet</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Use the assigner below to link this master subject to specific branch programs (e.g. CSE Semester 1).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {offerings.map((off: any) => (
              <div 
                key={off.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">
                      {off.branches?.name || 'Unknown Branch'}
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center gap-2">
                      <span className="font-mono text-zinc-500">[{off.branches?.short_code || 'N/A'}]</span>
                      <span>•</span>
                      <span className="text-indigo-400 font-medium">
                        Semester {off.semesters?.number ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <form action={removeSubjectOffering}>
                  <input type="hidden" name="offering_id" value={off.id} />
                  <input type="hidden" name="subject_id" value={subject.id} />
                  <button 
                    type="submit"
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                    title="Remove from this semester"
                  >
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {/* Interactive Assigner to Add Offerings */}
        <OfferingAssigner 
          subjectId={subject.id} 
          branches={branchesRes.data || []} 
          semesters={semestersRes.data || []} 
        />
      </div>
    </div>
  )
}
