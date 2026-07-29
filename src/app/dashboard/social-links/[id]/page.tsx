import { createAdminClient } from '@/utils/supabase/server'
import SocialLinkForm from '@/components/SocialLinkForm'
import { notFound } from 'next/navigation'

export default async function EditSocialLinkPage({ params }: { params: { id: string } }) {
  const supabase = await createAdminClient()
  const { data: link } = await supabase
    .from('social_links')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!link) {
    notFound()
  }

  return <SocialLinkForm initialData={link} />
}
