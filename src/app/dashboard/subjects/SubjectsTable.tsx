'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Edit2, Layers, BookOpen, ChevronRight, CheckCircle2, XCircle } from 'lucide-react'
import { DeleteButton } from '@/components/DeleteButton'
import { deleteSubject } from './actions'

export interface OfferingItem {
  id: string
  branch_id: string
  semester_id: string
  branches?: { name: string; short_code: string }
  semesters?: { number: number }
}

export interface SubjectRow {
  id: string
  name: string
  short_name?: string
  category?: string
  description?: string
  theme_color?: string
  accent_color?: string
  is_active: boolean
  sort_order?: number
  branch_subjects?: OfferingItem[]
  // Legacy fields
  branch_id?: string
  semester_id?: string
  branches?: { name: string; short_code: string }
  semesters?: { number: number }
}

export default function SubjectsTable({ subjects }: { subjects: SubjectRow[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Group duplicate subjects by normalized name into unique Master Subjects
  const deduplicatedMasterSubjects = useMemo(() => {
    const map = new Map<string, {
      subject: SubjectRow
      offerings: OfferingItem[]
    }>()

    subjects.forEach((s) => {
      const key = (s.name || '').trim().toLowerCase()
      if (!key) return

      // Extract offerings from branch_subjects or legacy branch_id/semester_id
      const currentOfferings: OfferingItem[] = s.branch_subjects && s.branch_subjects.length > 0
        ? s.branch_subjects
        : (s.branches && s.semesters ? [{
            id: `legacy_${s.id}`,
            branch_id: s.branch_id || '',
            semester_id: s.semester_id || '',
            branches: s.branches,
            semesters: s.semesters,
          }] : [])

      if (!map.has(key)) {
        map.set(key, {
          subject: { ...s },
          offerings: [...currentOfferings]
        })
      } else {
        const existing = map.get(key)!
        // Merge offerings without duplicates
        const seenOfferingKeys = new Set(existing.offerings.map(o => `${o.branch_id}_${o.semester_id}`))
        currentOfferings.forEach(off => {
          const offKey = `${off.branch_id}_${off.semester_id}`
          if (!seenOfferingKeys.has(offKey)) {
            seenOfferingKeys.add(offKey)
            existing.offerings.push(off)
          }
        })
        // If the secondary row has extra info, keep the best
        if (!existing.subject.short_name && s.short_name) {
          existing.subject.short_name = s.short_name
        }
      }
    })

    return Array.from(map.values()).map(item => ({
      ...item.subject,
      branch_subjects: item.offerings
    }))
  }, [subjects])

  const filteredSubjects = useMemo(() => {
    return deduplicatedMasterSubjects.filter((s) => {
      const matchesSearch = 
        !searchTerm || 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.short_name && s.short_name.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCat = 
        categoryFilter === 'ALL' || 
        (s.category || '').toLowerCase() === categoryFilter.toLowerCase()

      const matchesStatus = 
        statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' ? s.is_active : !s.is_active)

      return matchesSearch && matchesCat && matchesStatus
    })
  }, [deduplicatedMasterSubjects, searchTerm, categoryFilter, statusFilter])

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-2xl backdrop-blur-xl">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search subjects by name or code (e.g. Applied Physics)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-950/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="ALL">All Categories</option>
            <option value="theory">Theory</option>
            <option value="practical">Practical / Lab</option>
            <option value="elective">Elective</option>
            <option value="audit">Audit</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/60 text-xs uppercase text-zinc-400 border-b border-zinc-800/50">
              <tr>
                <th className="px-6 py-4 font-medium">Subject</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Academic Offerings</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                    No subjects found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => {
                  const offerings = subject.branch_subjects || []
                  const hasOfferings = offerings.length > 0

                  return (
                    <tr key={subject.id} className="hover:bg-zinc-800/30 transition-colors group">
                      {/* Subject Name & Indicator */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" 
                            style={{ backgroundColor: subject.theme_color || '#EA580C' }}
                          />
                          <div>
                            <Link
                              href={`/dashboard/subjects/${subject.id}`}
                              className="font-semibold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                            >
                              {subject.name}
                            </Link>
                            {subject.short_name && (
                              <span className="text-xs font-mono text-zinc-500 uppercase">
                                {subject.short_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium capitalize border ${
                          (subject.category || '').toLowerCase() === 'practical'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : (subject.category || '').toLowerCase() === 'elective'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {subject.category || 'Theory'}
                        </span>
                      </td>

                      {/* Offerings */}
                      <td className="px-6 py-4">
                        {hasOfferings ? (
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {offerings.slice(0, 3).map((off, oIdx) => (
                              <span
                                key={off.id || oIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-950 text-zinc-300 border border-zinc-800"
                              >
                                <span className="font-mono text-zinc-400 font-semibold">{off.branches?.short_code || off.branches?.name || 'Branch'}</span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-indigo-400 font-medium">Sem {off.semesters?.number ?? '?'}</span>
                              </span>
                            ))}
                            {offerings.length > 3 && (
                              <Link
                                href={`/dashboard/subjects/${subject.id}#offerings`}
                                className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                              >
                                +{offerings.length - 3} more
                              </Link>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={`/dashboard/subjects/${subject.id}#offerings`}
                            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
                          >
                            <Layers size={13} />
                            <span>Unassigned (Assign now)</span>
                          </Link>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          subject.is_active 
                            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' 
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {subject.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            href={`/dashboard/subjects/${subject.id}`}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Edit Subject & Offerings"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <form action={deleteSubject}>
                            <input type="hidden" name="id" value={subject.id} />
                            <DeleteButton confirmMessage={`Delete master subject "${subject.name}"? This will remove its assignments across all branches.`} />
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
