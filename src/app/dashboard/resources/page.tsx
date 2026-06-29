import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Edit2, FileText, Video, Link as LinkIcon } from 'lucide-react'
import { deleteResource } from './actions'
import { DeleteButton } from '@/components/DeleteButton'

export default async function ResourcesPage() {
  const supabase = await createAdminClient()
  
  const { data: resources } = await supabase
    .from('resources')
    .select('*, subjects(name, branches(short_code), semesters(number))')
    .order('created_at', { ascending: false })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} className="text-rose-400" />
      case 'external_link': return <LinkIcon size={16} className="text-amber-400" />
      default: return <FileText size={16} className="text-indigo-400" />
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Resources</h1>
        <Link 
          href="/dashboard/resources/new" 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Upload Resource
        </Link>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-400 border-b border-zinc-800/50">
              <tr>
                <th className="px-6 py-4 font-medium">Resource</th>
                <th className="px-6 py-4 font-medium">Subject & Hierarchy</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Storage</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {!resources?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    No resources found. Upload one to get started.
                  </td>
                </tr>
              ) : (
                resources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                          {getTypeIcon(resource.type)}
                        </div>
                        <div>
                          <div className="font-semibold text-white truncate max-w-[200px]">{resource.title}</div>
                          {resource.file_size && <div className="text-xs text-zinc-500">{resource.file_size} • {resource.file_format}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-300 truncate max-w-[150px]">
                        {(resource.subjects as any)?.name || 'Unknown Subject'}
                      </div>
                      <div className="text-xs text-zinc-500 truncate max-w-[150px]">
                        {(resource.subjects as any)?.branches?.short_code} • Sem {(resource.subjects as any)?.semesters?.number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-zinc-700">
                        {resource.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-xs text-zinc-400">
                        {resource.storage_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/dashboard/resources/${resource.id}`}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <form action={deleteResource}>
                          <input type="hidden" name="id" value={resource.id} />
                          <DeleteButton confirmMessage="Are you sure you want to delete this resource?" />
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
