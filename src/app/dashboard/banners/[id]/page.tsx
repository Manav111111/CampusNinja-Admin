import { createAdminClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import BannerForm from '@/components/BannerForm'

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createAdminClient()
  
  const { data: banner } = await supabase
    .from('banners')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (!banner) {
    notFound()
  }

  return <BannerForm initialData={banner} />
}
