import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Edit2, Image as ImageIcon } from 'lucide-react'
import { deleteBanner } from './actions'
import { DeleteButton } from '@/components/DeleteButton'
import Image from 'next/image'

export default async function BannersPage() {
  const supabase = await createAdminClient()
  
  const { data: banners, error } = await supabase
    .from('banners')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Banners</h1>
        <Link 
          href="/dashboard/banners/new" 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Banner
        </Link>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-400 border-b border-zinc-800/50">
              <tr>
                <th className="px-6 py-4 font-medium">Banner</th>
                <th className="px-6 py-4 font-medium">Screen</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {!banners?.length ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    No banners found. Create one to get started.
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-16 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                           {banner.image_url ? (
                             // Using standard img tag as image_url might be from any external source not configured in next.config.js
                             <img 
                               src={banner.image_url} 
                               alt={banner.title} 
                               className="w-full h-full object-cover"
                             />
                           ) : (
                             <ImageIcon className="text-zinc-600" size={24} />
                           )}
                        </div>
                        <div>
                          <div className="font-semibold text-white max-w-[200px] md:max-w-[300px] truncate">{banner.title}</div>
                          {banner.subtitle && <div className="text-xs text-zinc-500 max-w-[200px] md:max-w-[300px] truncate">{banner.subtitle}</div>}
                          {banner.button_text && <div className="text-xs text-indigo-400 mt-1">Button: {banner.button_text}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-300 uppercase tracking-wider">
                        {banner.screen_name || 'home'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-zinc-700">
                        {banner.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        banner.is_active 
                          ? 'bg-emerald-400/10 text-emerald-400' 
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/dashboard/banners/${banner.id}`}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <form action={deleteBanner}>
                          <input type="hidden" name="id" value={banner.id} />
                          <DeleteButton confirmMessage="Are you sure you want to delete this banner?" />
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
