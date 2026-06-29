import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { BellPlus, MessageSquare } from 'lucide-react'

export default async function NotificationsPage() {
  const supabase = await createAdminClient()
  
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*, branches(name), semesters(number)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Notification Center</h1>
        <Link 
          href="/dashboard/notifications/new" 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <BellPlus size={18} />
          Send Notification
        </Link>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-400 border-b border-zinc-800/50">
              <tr>
                <th className="px-6 py-4 font-medium">Notification</th>
                <th className="px-6 py-4 font-medium">Target Audience</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {!notifications?.length ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    No notifications sent yet.
                  </td>
                </tr>
              ) : (
                notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-2 bg-zinc-800 rounded-lg text-indigo-400">
                          <MessageSquare size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{notif.title}</div>
                          <div className="text-zinc-400 mt-1 max-w-md line-clamp-2">{notif.message}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-300">
                        {notif.target_branch_id ? (notif.branches as any)?.name : 'All Branches'}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {notif.target_semester_id ? `Semester ${(notif.semesters as any)?.number}` : 'All Semesters'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-400/10 text-emerald-400 capitalize">
                        {notif.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {new Date(notif.created_at).toLocaleString()}
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
