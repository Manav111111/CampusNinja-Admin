'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Sparkles, BookOpen, Layers, CheckCircle2, HelpCircle } from 'lucide-react'
import { createSubject, updateSubject } from '@/app/dashboard/subjects/actions'

const CATEGORY_OPTIONS = [
  { value: 'theory', label: 'Theory', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'practical', label: 'Practical / Lab', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'elective', label: 'Elective', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { value: 'audit', label: 'Audit / Non-Credit', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
]

const COLOR_PRESETS = [
  { theme: '#EA580C', accent: '#FFEDD5', name: 'Orange' },
  { theme: '#3B82F6', accent: '#DBEAFE', name: 'Blue' },
  { theme: '#10B981', accent: '#D1FAE5', name: 'Emerald' },
  { theme: '#8B5CF6', accent: '#EDE9FE', name: 'Purple' },
  { theme: '#EC4899', accent: '#FCE7F3', name: 'Pink' },
  { theme: '#F59E0B', accent: '#FEF3C7', name: 'Amber' },
  { theme: '#06B6D4', accent: '#CFFAFE', name: 'Cyan' },
  { theme: '#6366F1', accent: '#E0E7FF', name: 'Indigo' },
]

const ICON_PRESETS = [
  { name: 'book-outline', label: 'Book' },
  { name: 'code-slash-outline', label: 'Code' },
  { name: 'flask-outline', label: 'Lab' },
  { name: 'calculator-outline', label: 'Math' },
  { name: 'hardware-chip-outline', label: 'Hardware' },
  { name: 'globe-outline', label: 'Global / Network' },
  { name: 'bulb-outline', label: 'Idea / General' },
]

export default function SubjectForm({ 
  initialData,
}: { 
  initialData?: any,
}) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [themeColor, setThemeColor] = useState(initialData?.theme_color || '#EA580C')
  const [accentColor, setAccentColor] = useState(initialData?.accent_color || '#FFEDD5')
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || 'theory')
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon_name || 'book-outline')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    formData.set('category', selectedCategory)
    formData.set('theme_color', themeColor)
    formData.set('accent_color', accentColor)
    formData.set('icon_name', selectedIcon)
    
    let result
    if (initialData?.id) {
      formData.append('id', initialData.id)
      result = await updateSubject(formData)
    } else {
      result = await createSubject(formData)
    }

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/subjects" 
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {initialData ? 'Edit Master Subject' : 'New Master Subject'}
            </h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {initialData 
                ? 'Update master subject definition in your central library'
                : 'Create a reusable subject once, then assign it to any branch/semester'
              }
            </p>
          </div>
        </div>

        {initialData?.id && (
          <Link
            href={`/dashboard/subjects/${initialData.id}#offerings`}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors border border-zinc-700"
          >
            <Layers size={14} className="text-indigo-400" />
            Manage Offerings
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-900/50 text-red-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Info Banner */}
      {!initialData && (
        <div className="flex items-start gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-300">
          <Sparkles size={18} className="shrink-0 text-indigo-400 mt-0.5" />
          <div>
            <span className="font-semibold text-indigo-200">Central Master Subject Library:</span> You do not need to choose a branch or semester here. Once created, you can assign this subject to as many branches and semesters as needed (e.g. CSE Sem 1, Civil Sem 1, ECE Sem 1) with shared syllabus and notes.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-xl">
        {/* Core Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-zinc-300">Subject Name <span className="text-red-400">*</span></label>
            <input 
              name="name" 
              defaultValue={initialData?.name} 
              required 
              placeholder="e.g. Applied Physics"
              className="w-full rounded-xl px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Short Name / Code</label>
            <input 
              name="short_name" 
              defaultValue={initialData?.short_name} 
              placeholder="e.g. AP"
              className="w-full rounded-xl px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-mono uppercase"
            />
          </div>
        </div>

        {/* Category Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORY_OPTIONS.map((cat) => {
              const isSelected = selectedCategory === cat.value
              return (
                <button
                  type="button"
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center justify-center py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected 
                      ? `${cat.color} ring-2 ring-indigo-500/50 shadow-sm`
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Description</label>
          <textarea 
            name="description" 
            defaultValue={initialData?.description || ''} 
            rows={3}
            placeholder="Brief overview or objectives for this subject..."
            className="w-full rounded-xl px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm resize-none"
          />
        </div>

        {/* Visual Styling: Colors & Icons */}
        <div className="border-t border-zinc-800/80 pt-6 space-y-6">
          <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-400" />
            Visual Identity
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Color Palette */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-400">Theme Color Preset</label>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.name}
                    onClick={() => {
                      setThemeColor(preset.theme)
                      setAccentColor(preset.accent)
                    }}
                    className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center ${
                      themeColor.toLowerCase() === preset.theme.toLowerCase()
                        ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-zinc-900'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: preset.theme }}
                    title={preset.name}
                  >
                    {themeColor.toLowerCase() === preset.theme.toLowerCase() && (
                      <CheckCircle2 size={14} className="text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input 
                  type="color" 
                  value={themeColor} 
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-zinc-400">{themeColor}</span>
              </div>
            </div>

            {/* Icon Presets */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-400">Icon Preset</label>
              <div className="flex flex-wrap gap-2">
                {ICON_PRESETS.map((icon) => (
                  <button
                    type="button"
                    key={icon.name}
                    onClick={() => setSelectedIcon(icon.name)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      selectedIcon === icon.name 
                        ? 'bg-indigo-600 text-white border-indigo-500' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {icon.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status and Sort Order */}
        <div className="border-t border-zinc-800/80 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Display Order</label>
            <input 
              type="number"
              name="sort_order" 
              defaultValue={initialData?.sort_order ?? 0} 
              min={0}
              className="w-full rounded-xl px-4 py-2.5 bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 pt-6 sm:pt-4">
            <input 
              type="checkbox" 
              name="is_active" 
              id="is_active"
              defaultChecked={initialData ? initialData.is_active : true}
              className="w-5 h-5 rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-500/50"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-zinc-300 cursor-pointer">
              Active in Subject Library
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
          <Link
            href="/dashboard/subjects"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-600/20"
          >
            <Save size={18} />
            {isPending ? 'Saving...' : initialData ? 'Save Changes' : 'Create Master Subject'}
          </button>
        </div>
      </form>
    </div>
  )
}
