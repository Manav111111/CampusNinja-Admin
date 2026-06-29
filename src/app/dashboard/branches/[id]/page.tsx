import { createAdminClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import BranchForm from '@/components/BranchForm'

export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createAdminClient()
  
  const { data: branch } = await supabase
    .from('branches')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (!branch) {
    notFound()
  }

  return <BranchForm initialData={branch} />
}
