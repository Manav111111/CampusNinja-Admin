import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Edit2, Share2, MessageCircle, Video, Camera } from 'lucide-react'
import { deleteSocialLink } from './actions'
import { DeleteButton } from '@/components/DeleteButton'

export default async function SocialLinksPage() {
  const supabase = await createAdminClient()
  
  const { data: links, error } = await supabase
    .from('social_links')
    .select('*')
    .order('platform', { ascending: true })
    .order('sort_order', { ascending: true })

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp':
        return <MessageCircle className="text-emerald-400" size={18} />
      case 'youtube':
        return <Video className="text-red-400" size={18} />
      case 'instagram':
        return <Camera className="text-pink-400" size={18} />
      default:
        return <Share2 className="text-indigo-400" size={18} />
    }
  }

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'whatsapp':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'youtube':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'instagram':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20'
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Community & Social Links</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage official WhatsApp communities, YouTube channels, and Instagram pages displayed in the app.</p>
        </div>
        <Link 
          href="/dashboard/social-links/new" 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Link
        </Link>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-400 border-b border-zinc-800/50">
              <tr>
                <th className="px-6 py-4 font-medium">Platform</th>
                <th className="px-6 py-4 font-medium">Name & Description</th>
                <th className="px-6 py-4 font-medium">Stats / Count</th>
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {!links?.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No social links found. Click "Add Link" to create one.
                  </td>
                </tr>
              ) : (
                links.map((link) => (
                  <tr key={link.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border ${getPlatformBadge(link.platform)}`}>
                        {getPlatformIcon(link.platform)}
                        {link.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{link.name}</div>
                      {link.description && <div className="text-xs text-zinc-500 max-w-md truncate mt-0.5">{link.description}</div>}
                      <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline mt-1 block truncate max-w-xs">
                        {link.url}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-md">
                        {link.subscriber_count || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-zinc-700">
                        {link.sort_order}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        link.is_active 
                          ? 'bg-emerald-400/10 text-emerald-400' 
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {link.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/dashboard/social-links/${link.id}`}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <form action={deleteSocialLink}>
                          <input type="hidden" name="id" value={link.id} />
                          <DeleteButton confirmMessage="Are you sure you want to delete this social link?" />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
