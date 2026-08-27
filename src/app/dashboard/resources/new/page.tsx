import { createAdminClient } from '@/utils/supabase/server'
import ResourceForm from '@/components/ResourceForm'

export default async function NewResourcePage() {
  const supabase = await createAdminClient()
  
  const [branchesRes, semestersRes, subjectsRes] = await Promise.all([
    supabase.from('branches').select('id, name').order('name'),
    supabase.from('semesters').select('id, branch_id, number').order('number'),
    supabase.from('subjects').select('id, name, short_name, category').order('name')
  ])
  
  return (
    <ResourceForm 
      branches={branchesRes.data || []}
      semesters={semestersRes.data || []}
      subjects={subjectsRes.data || []} 
    />
  )
}
