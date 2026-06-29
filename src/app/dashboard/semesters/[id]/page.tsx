import { createAdminClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import SemesterForm from '@/components/SemesterForm'

export default async function EditSemesterPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createAdminClient()
  
  const [semesterRes, branchesRes] = await Promise.all([
    supabase.from('semesters').select('*').eq('id', resolvedParams.id).single(),
    supabase.from('branches').select('id, name').order('name')
  ])

  if (!semesterRes.data) {
    notFound()
  }

  return <SemesterForm initialData={semesterRes.data} branches={branchesRes.data || []} />
}
