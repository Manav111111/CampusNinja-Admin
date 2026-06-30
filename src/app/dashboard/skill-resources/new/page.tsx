import { createAdminClient } from '@/utils/supabase/server'
import SkillResourceForm from '@/components/SkillResourceForm'

export default async function NewSkillResourcePage() {
  const supabase = await createAdminClient()
  
  const { data: skills } = await supabase
    .from('skills')
    .select('id, name, difficulty_level')
    .order('sort_order', { ascending: true })

  return <SkillResourceForm skills={skills || []} />
}
