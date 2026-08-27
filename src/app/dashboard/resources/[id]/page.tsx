import { createAdminClient } from '@/utils/supabase/server'
import ResourceForm from '@/components/ResourceForm'
import { getSubjectSyllabusData } from '../actions'
import { notFound } from 'next/navigation'

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createAdminClient()
  
  const [resourceRes, branchesRes, semestersRes, subjectsRes] = await Promise.all([
    supabase.from('resources').select('*').eq('id', resolvedParams.id).single(),
    supabase.from('branches').select('id, name').order('name'),
    supabase.from('semesters').select('id, branch_id, number').order('number'),
    supabase.from('subjects').select('id, semester_id, branch_id, name, branches(name), semesters(number)').order('name')
  ])

  if (!resourceRes.data) notFound()

  let initialSyllabusData = null
  if (resourceRes.data.type === 'syllabus' && resourceRes.data.subject_id) {
    initialSyllabusData = await getSubjectSyllabusData(resourceRes.data.subject_id)
  }

  return (
    <ResourceForm 
      initialData={resourceRes.data} 
      initialSyllabusData={initialSyllabusData}
      branches={branchesRes.data || []}
      semesters={semestersRes.data || []}
      subjects={subjectsRes.data || []} 
    />
  )
}
