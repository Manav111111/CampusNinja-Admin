import { createAdminClient } from '@/utils/supabase/server'
import SemesterForm from '@/components/SemesterForm'

export default async function NewSemesterPage() {
  const supabase = await createAdminClient()
  
  const { data: branches } = await supabase
    .from('branches')
    .select('id, name')
    .order('name')

  return <SemesterForm branches={branches || []} />
}
