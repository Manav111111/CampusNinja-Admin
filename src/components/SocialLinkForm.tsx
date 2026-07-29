'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { createSocialLink, updateSocialLink } from '@/app/dashboard/social-links/actions'

export default function SocialLinkForm({ initialData }: { initialData?: any }) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    setError(null)

    if (initialData?.id) {
      formData.append('id', initialData.id)
      const res = await updateSocialLink(formData)
      if (res?.error) {
        setError(res.error)
        setIsPending(false)
      }
    } else {
      const res = await createSocialLink(formData)
      if (res?.error) {
        setError(res.error)
        setIsPending(false)
      }
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/social-links"
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {initialData ? 'Edit Social Link' : 'Add Social Link'}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Configure details for WhatsApp communities, YouTube channels, or Instagram accounts.</p>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-xl">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Platform *
            </label>
            <select
              name="platform"
              defaultValue={initialData?.platform || 'whatsapp'}
              required
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="whatsapp">WhatsApp Community</option>
              <option value="youtube">YouTube Channel</option>
              <option value="instagram">Instagram Account</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Name *
            </label>
            <input
              type="text"
              name="name"
              defaultValue={initialData?.name || ''}
              required
              placeholder="e.g. Campus Ninja Coding or B.Tech 1st Year"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Target URL *
            </label>
            <input
              type="url"
              name="url"
              defaultValue={initialData?.url || ''}
              required
              placeholder="https://chat.whatsapp.com/... or https://youtube.com/@..."
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              name="description"
              defaultValue={initialData?.description || ''}
              placeholder="e.g. Official placement prep group or Daily tutorial shorts"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Member / Subscriber Count
              </label>
              <input
                type="text"
                name="subscriber_count"
                defaultValue={initialData?.subscriber_count || ''}
                placeholder="e.g. 15.2K Subs or 850+ Members"
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Display Priority / Sort Order
              </label>
              <input
                type="number"
                name="sort_order"
                defaultValue={initialData?.sort_order ?? 1}
                placeholder="1"
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              defaultChecked={initialData ? initialData.is_active : true}
              className="h-4 w-4 rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-indigo-500/50"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-zinc-300">
              Active (show in app)
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-800/50">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {initialData ? 'Update Link' : 'Create Link'}
          </button>
        </div>
      </form>
    </div>
  )
}
