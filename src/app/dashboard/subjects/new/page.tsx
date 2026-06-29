import { createAdminClient } from '@/utils/supabase/server'
import SubjectForm from '@/components/SubjectForm'

export default async function NewSubjectPage() {
  const supabase = await createAdminClient()
  
  const [branchesRes, semestersRes] = await Promise.all([
    supabase.from('branches').select('id, name').order('name'),
    supabase.from('semesters').select('id, branch_id, number').order('number')
  ])

  return (
    <SubjectForm 
      branches={branchesRes.data || []} 
      semesters={semestersRes.data || []} 
    />
  )
}
