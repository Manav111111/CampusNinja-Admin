import { createAdminClient } from '@/utils/supabase/server'
import SkillForm from '@/components/SkillForm'
import { notFound } from 'next/navigation'

export default async function EditSkillPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase.from('skills').select('*').eq('id', resolvedParams.id).single()

  if (error || !data) notFound()

  return <SkillForm initialData={data} />
}
