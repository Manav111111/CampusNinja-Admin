import { createAdminClient } from '@/utils/supabase/server'
import NotificationForm from '@/components/NotificationForm'

export default async function NewNotificationPage() {
  const supabase = await createAdminClient()
  
  const [branchesRes, semestersRes] = await Promise.all([
    supabase.from('branches').select('id, name').order('name'),
    supabase.from('semesters').select('id, branch_id, number').order('number')
  ])

  return (
    <NotificationForm 
      branches={branchesRes.data || []} 
      semesters={semestersRes.data || []} 
    />
  )
}
