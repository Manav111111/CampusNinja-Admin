import { createAdminClient } from '@/utils/supabase/server'
import SubjectForm from '@/components/SubjectForm'
import { notFound } from 'next/navigation'

export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const supabase = await createAdminClient()
  
  const [subjectRes, branchesRes, semestersRes] = await Promise.all([
    supabase.from('subjects').select('*').eq('id', resolvedParams.id).single(),
    supabase.from('branches').select('id, name').order('name'),
    supabase.from('semesters').select('id, branch_id, number').order('number')
  ])

  if (subjectRes.error || !subjectRes.data) {
    notFound()
  }

  return (
    <SubjectForm 
      initialData={subjectRes.data} 
      branches={branchesRes.data || []}
      semesters={semestersRes.data || []}
    />
  )
}
