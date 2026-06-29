import { createAdminClient } from '@/utils/supabase/server'
import SettingsForm from '@/components/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createAdminClient()
  
  // Fetch the single settings row
  const { data: settings } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000000')
    .single()

  return <SettingsForm initialData={settings || {}} />
}
