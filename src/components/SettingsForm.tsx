'use client'

import { useState } from 'react'
import { Save, CheckCircle2 } from 'lucide-react'
import { updateSystemSettings } from '@/app/dashboard/settings/actions'

export default function SettingsForm({ initialData }: { initialData: any }) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    setSuccess(false)
    
    const formData = new FormData(e.currentTarget)
    const result = await updateSystemSettings(formData)

    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    
    setIsPending(false)
  }

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">System Settings</h1>
        <p className="text-zinc-400 mt-2">Manage global app configurations and community links.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-900/50 text-red-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 rounded-xl text-sm font-medium flex items-center gap-2">
          <CheckCircle2 size={16} />
          Settings saved successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 md:p-8 space-y-8 backdrop-blur-xl">
        
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-white border-b border-zinc-800/50 pb-2">Community Links</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">WhatsApp Link</label>
              <input 
                name="whatsapp_link" 
                defaultValue={initialData?.whatsapp_link} 
                placeholder="https://chat.whatsapp.com/..."
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Instagram Link</label>
              <input 
                name="instagram_link" 
                defaultValue={initialData?.instagram_link} 
                placeholder="https://instagram.com/..."
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">YouTube Link</label>
              <input 
                name="youtube_link" 
                defaultValue={initialData?.youtube_link} 
                placeholder="https://youtube.com/@..."
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Telegram Link</label>
              <input 
                name="telegram_link" 
                defaultValue={initialData?.telegram_link} 
                placeholder="https://t.me/..."
                className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end border-t border-zinc-800/50">
          <button 
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            {isPending ? 'Saving...' : (
              <>
                <Save size={18} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
