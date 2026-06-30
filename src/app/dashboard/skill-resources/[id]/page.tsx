import { createAdminClient } from '@/utils/supabase/server'
import SkillResourceForm from '@/components/SkillResourceForm'
import { notFound } from 'next/navigation'

export default async function EditSkillResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createAdminClient()
  
  const { data: resource, error } = await supabase
    .from('skill_resources')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (error || !resource) {
    notFound()
  }

  const { data: skills } = await supabase
    .from('skills')
    .select('id, name, difficulty_level')
    .order('sort_order', { ascending: true })

  return <SkillResourceForm initialData={resource} skills={skills || []} />
}
