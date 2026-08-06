import { createAdminClient } from '@/utils/supabase/server'
import SocialLinkForm from '@/components/SocialLinkForm'
import { notFound } from 'next/navigation'

export default async function EditSocialLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createAdminClient()
  const { data: link } = await supabase
    .from('social_links')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (!link) {
    notFound()
  }

  return <SocialLinkForm initialData={link} />
}
