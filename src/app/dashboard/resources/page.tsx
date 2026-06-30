import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Edit2, FileText, Video, Link as LinkIcon, Eye, EyeOff, Layers, Newspaper, Sparkles, Star } from 'lucide-react'
import { deleteResource, toggleResourceStatus } from './actions'
import { DeleteButton } from '@/components/DeleteButton'

export default async function ResourcesPage() {
  const supabase = await createAdminClient()
  
  const { data: resources } = await supabase
    .from('resources')
    .select('*, subjects(name, branches(short_code), semesters(number))')
    .order('created_at', { ascending: false })

  const activeResources = resources?.filter(r => r.is_active) || []
  const notesCount = activeResources.filter(r => r.type === 'notes').length
  const pyqsCount = activeResources.filter(r => r.type === 'pyq').length
  const videosCount = activeResources.filter(r => r.type === 'video').length
  const syllabusCount = activeResources.filter(r => r.type === 'syllabus').length

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} className="text-rose-400" />
      case 'external_link': return <LinkIcon size={16} className="text-amber-400" />
      case 'pyq': return <Layers size={16} className="text-purple-400" />
      case 'syllabus': return <Newspaper size={16} className="text-emerald-400" />
      case 'important_questions': return <Star size={16} className="text-yellow-400" />
      case 'ai_resources': return <Sparkles size={16} className="text-cyan-400" />
      default: return <FileText size={16} className="text-indigo-400" />
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Resources</h1>
          <p className="text-xs text-zinc-400 mt-1">Manage academic study materials, PYQs, and video lectures.</p>
        </div>
        <Link 
          href="/dashboard/resources/new" 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={18} />
          Upload Resource
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-xl">
          <p className="text-xs text-zinc-400 font-medium">Total Active</p>
          <p className="text-2xl font-bold text-white mt-1">{activeResources.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/30 backdrop-blur-xl">
          <p className="text-xs text-indigo-300 font-medium">Notes Available</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{notesCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/30 backdrop-blur-xl">
          <p className="text-xs text-purple-300 font-medium">PYQs Available</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{pyqsCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 backdrop-blur-xl">
          <p className="text-xs text-rose-300 font-medium">Videos Available</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{videosCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30 backdrop-blur-xl">
          <p className="text-xs text-emerald-300 font-medium">Syllabus Available</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{syllabusCount}</p>
        </div>
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
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {!resources?.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No resources found. Upload one to get started.
                  </td>
                </tr>
              ) : (
                resources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                          {getTypeIcon(resource.type)}
                        </div>
                        <div>
                          <div className="font-semibold text-white truncate max-w-[220px]">{resource.title}</div>
                          {resource.file_size && <div className="text-xs text-zinc-500 mt-0.5">{resource.file_size} • {resource.file_format}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-200 font-medium truncate max-w-[170px]">
                        {(resource.subjects as any)?.name || 'Unknown Subject'}
                      </div>
                      <div className="text-xs text-zinc-500 truncate max-w-[170px] mt-0.5">
                        {(resource.subjects as any)?.branches?.short_code} • Sem {(resource.subjects as any)?.semesters?.number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize inline-flex items-center rounded-md bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-zinc-700">
                        {resource.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-xs text-zinc-400 font-medium">
                        {resource.storage_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        resource.is_active 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${resource.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {resource.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <form action={toggleResourceStatus}>
                          <input type="hidden" name="id" value={resource.id} />
                          <input type="hidden" name="current_status" value={String(resource.is_active)} />
                          <button 
                            type="submit"
                            title={resource.is_active ? "Hide Resource" : "Restore Resource"}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            {resource.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </form>
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

