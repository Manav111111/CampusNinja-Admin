'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Video, 
  HardDrive, 
  ExternalLink, 
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  ListPlus,
  FileCode,
  Layers,
  Sparkles,
  BookOpen,
  Info,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { createResource, updateResource, getSubjectSyllabusData, SyllabusUnitData, SyllabusTopicData } from '@/app/dashboard/resources/actions'

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

interface EditableTopic {
  id?: string;
  tempKey: string;
  title: string;
  description?: string;
}

interface EditableUnit {
  id?: string;
  tempKey: string;
  unit_number: number;
  title: string;
  description: string;
  isExpanded: boolean;
  bulkMode: boolean;
  bulkText: string;
  newTopicText: string;
  topics: EditableTopic[];
}

export default function ResourceForm({ 
  initialData, 
  initialSyllabusData,
  branches = [], 
  semesters = [], 
  subjects = [] 
}: { 
  initialData?: any, 
  initialSyllabusData?: { syllabus: any, units: SyllabusUnitData[] } | null,
  branches?: { id: string, name: string }[], 
  semesters?: { id: string, branch_id: string, number: number }[], 
  subjects?: { id: string, semester_id?: string, branch_id?: string, name: string, short_name?: string, category?: string }[] 
}) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resourceType, setResourceType] = useState<string>(initialData?.type || 'notes')
  const [storageType, setStorageType] = useState(initialData?.storage_type || 'supabase_file')
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialData?.subject_id || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtube_url || '')
  const [showOptionalSyllabusFile, setShowOptionalSyllabusFile] = useState(Boolean(initialSyllabusData?.syllabus?.file_url || initialData?.file_url))

  // Fast Async Upload State
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadBytesStatus, setUploadBytesStatus] = useState<string>('')
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>(initialData?.file_url || '')
  const [uploadedFileSize, setUploadedFileSize] = useState<string>(initialData?.file_size || '')
  const [uploadedFileFormat, setUploadedFileFormat] = useState<string>(initialData?.file_format || '')
  const [uploadedFileName, setUploadedFileName] = useState<string>(
    initialData?.file_url ? (initialData.file_url.split('/').pop() || 'Existing Attachment') : ''
  )
  const [uploadError, setUploadError] = useState<string | null>(null)
  const activeUploadXhrRef = useRef<XMLHttpRequest | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const syllabusFileInputRef = useRef<HTMLInputElement>(null)

  const uploadFileWithProgress = (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('File is too large. Maximum allowed size is 100MB.')
      return
    }

    if (activeUploadXhrRef.current) {
      activeUploadXhrRef.current.abort()
      activeUploadXhrRef.current = null
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)
    setSelectedFile(file)
    setUploadedFileName(file.name)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', selectedSubjectId || 'academic')

    const xhr = new XMLHttpRequest()
    activeUploadXhrRef.current = xhr

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        setUploadProgress(percent)
        const loadedMB = (event.loaded / (1024 * 1024)).toFixed(2)
        const totalMB = (event.total / (1024 * 1024)).toFixed(2)
        setUploadBytesStatus(`${loadedMB} MB / ${totalMB} MB (${percent}%)`)
      }
    }

    xhr.onload = () => {
      activeUploadXhrRef.current = null
      setIsUploading(false)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText)
          if (res.success && res.url) {
            setUploadedFileUrl(res.url)
            setUploadedFileSize(res.fileSize)
            setUploadedFileFormat(res.fileFormat)
            setUploadProgress(100)
            setUploadError(null)
          } else {
            setUploadError(res.error || 'Upload failed.')
            setUploadProgress(0)
          }
        } catch {
          setUploadError('Failed to parse server response.')
          setUploadProgress(0)
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText)
          setUploadError(res.error || `Upload failed (Status ${xhr.status})`)
        } catch {
          setUploadError(`Upload failed (Status ${xhr.status})`)
        }
        setUploadProgress(0)
      }
    }

    xhr.onerror = () => {
      activeUploadXhrRef.current = null
      setIsUploading(false)
      setUploadError('Network error while uploading. Please check connection.')
      setUploadProgress(0)
    }

    xhr.onabort = () => {
      activeUploadXhrRef.current = null
      setIsUploading(false)
      setUploadProgress(0)
    }

    xhr.open('POST', '/api/upload-resource')
    xhr.send(formData)
  }

  const cancelUpload = () => {
    if (activeUploadXhrRef.current) {
      activeUploadXhrRef.current.abort()
      activeUploadXhrRef.current = null
    }
    setIsUploading(false)
    setUploadProgress(0)
    setUploadBytesStatus('')
    setSelectedFile(null)
    setUploadedFileUrl('')
    setUploadedFileSize('')
    setUploadedFileFormat('')
    setUploadedFileName('')
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (syllabusFileInputRef.current) syllabusFileInputRef.current.value = ''
  }

  // Syllabus Editor State
  const [units, setUnits] = useState<EditableUnit[]>(() => {
    if (initialSyllabusData?.units && initialSyllabusData.units.length > 0) {
      return initialSyllabusData.units.map((u, idx) => ({
        id: u.id,
        tempKey: u.id || `unit_${idx}_${Date.now()}`,
        unit_number: u.unit_number || (idx + 1),
        title: u.title || '',
        description: u.description || '',
        isExpanded: idx === 0, // expand first unit by default
        bulkMode: false,
        bulkText: '',
        newTopicText: '',
        topics: (u.topics || []).map((t, tIdx) => ({
          id: t.id,
          tempKey: t.id || `topic_${idx}_${tIdx}_${Date.now()}`,
          title: t.title || '',
          description: t.description || '',
        })),
      }))
    }
    // Default initial unit for new syllabus
    return [
      {
        tempKey: `unit_0_${Date.now()}`,
        unit_number: 1,
        title: '',
        description: '',
        isExpanded: true,
        bulkMode: false,
        bulkText: '',
        newTopicText: '',
        topics: [],
      }
    ]
  })

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)
  const youtubeVideoId = extractYouTubeId(youtubeUrl)

  // Auto-fetch existing syllabus data if admin switches subject while in Syllabus mode
  useEffect(() => {
    if (resourceType === 'syllabus' && selectedSubjectId && !initialSyllabusData) {
      let isMounted = true
      getSubjectSyllabusData(selectedSubjectId).then(data => {
        if (!isMounted || !data?.units || data.units.length === 0) return
        setUnits(data.units.map((u, idx) => ({
          id: u.id,
          tempKey: u.id || `unit_${idx}_${Date.now()}`,
          unit_number: u.unit_number || (idx + 1),
          title: u.title || '',
          description: u.description || '',
          isExpanded: idx === 0,
          bulkMode: false,
          bulkText: '',
          newTopicText: '',
          topics: (u.topics || []).map((t, tIdx) => ({
            id: t.id,
            tempKey: t.id || `topic_${idx}_${tIdx}_${Date.now()}`,
            title: t.title || '',
            description: t.description || '',
          })),
        })))
        if (data.syllabus?.file_url) {
          setShowOptionalSyllabusFile(true)
        }
      })
      return () => { isMounted = false }
    }
  }, [selectedSubjectId, resourceType, initialSyllabusData])

  // Unit Management Functions
  const addUnit = () => {
    setUnits(prev => [
      ...prev,
      {
        tempKey: `unit_${prev.length}_${Date.now()}`,
        unit_number: prev.length + 1,
        title: '',
        description: '',
        isExpanded: true,
        bulkMode: false,
        bulkText: '',
        newTopicText: '',
        topics: [],
      }
    ])
  }

  const deleteUnit = (index: number) => {
    setUnits(prev => {
      const updated = prev.filter((_, i) => i !== index)
      // Renumber
      return updated.map((u, idx) => ({
        ...u,
        unit_number: idx + 1,
      }))
    })
  }

  const toggleExpandUnit = (index: number) => {
    setUnits(prev => prev.map((u, i) => i === index ? { ...u, isExpanded: !u.isExpanded } : u))
  }

  const moveUnit = (index: number, direction: 'up' | 'down') => {
    setUnits(prev => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.length) return prev
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[targetIndex]
      updated[targetIndex] = temp
      // Renumber
      return updated.map((u, idx) => ({
        ...u,
        unit_number: idx + 1,
      }))
    })
  }

  const updateUnitTitle = (index: number, title: string) => {
    setUnits(prev => prev.map((u, i) => i === index ? { ...u, title } : u))
  }

  const updateUnitDescription = (index: number, description: string) => {
    setUnits(prev => prev.map((u, i) => i === index ? { ...u, description } : u))
  }

  const setUnitNewTopicText = (unitIndex: number, text: string) => {
    setUnits(prev => prev.map((u, i) => i === unitIndex ? { ...u, newTopicText: text } : u))
  }

  const addSingleTopic = (unitIndex: number) => {
    setUnits(prev => prev.map((u, i) => {
      if (i !== unitIndex) return u
      const trimmed = u.newTopicText.trim()
      if (!trimmed) return u
      return {
        ...u,
        newTopicText: '',
        topics: [
          ...u.topics,
          {
            tempKey: `topic_${u.topics.length}_${Date.now()}`,
            title: trimmed,
          }
        ]
      }
    }))
  }

  const deleteTopic = (unitIndex: number, topicIndex: number) => {
    setUnits(prev => prev.map((u, i) => {
      if (i !== unitIndex) return u
      return {
        ...u,
        topics: u.topics.filter((_, tIdx) => tIdx !== topicIndex)
      }
    }))
  }

  const updateTopicTitle = (unitIndex: number, topicIndex: number, newTitle: string) => {
    setUnits(prev => prev.map((u, i) => {
      if (i !== unitIndex) return u
      return {
        ...u,
        topics: u.topics.map((t, tIdx) => tIdx === topicIndex ? { ...t, title: newTitle } : t)
      }
    }))
  }

  const toggleBulkMode = (unitIndex: number) => {
    setUnits(prev => prev.map((u, i) => i === unitIndex ? { ...u, bulkMode: !u.bulkMode } : u))
  }

  const setUnitBulkText = (unitIndex: number, text: string) => {
    setUnits(prev => prev.map((u, i) => i === unitIndex ? { ...u, bulkText: text } : u))
  }

  const applyBulkTopics = (unitIndex: number) => {
    setUnits(prev => prev.map((u, i) => {
      if (i !== unitIndex) return u
      const lines = u.bulkText
        .split('\n')
        .map(l => l.trim().replace(/^[-*•\d.)]+\s*/, '')) // clean leading bullets/numbers
        .filter(l => l.length > 0)

      if (lines.length === 0) return { ...u, bulkMode: false }

      const newTopics: EditableTopic[] = lines.map((line, lIdx) => ({
        tempKey: `topic_bulk_${lIdx}_${Date.now()}`,
        title: line,
      }))

      return {
        ...u,
        bulkMode: false,
        bulkText: '',
        topics: [...u.topics, ...newTopics],
      }
    }))
  }

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    if (!selectedSubjectId) {
      setError('Please select a subject.')
      setIsPending(false)
      return
    }

    if (isUploading) {
      setError('Please wait for the file upload to complete before saving.')
      setIsPending(false)
      return
    }

    if (resourceType === 'syllabus') {
      if (units.length === 0) {
        setError('Please add at least 1 unit to the syllabus.')
        setIsPending(false)
        return
      }

      // Check that each unit has at least one non-empty topic
      for (let i = 0; i < units.length; i++) {
        const u = units[i]
        const unitName = u.title.trim() || `Unit ${u.unit_number}`
        if (u.topics.length === 0) {
          setError(`Unit ${u.unit_number} ("${unitName}") has no topics. Please add at least 1 topic.`)
          setIsPending(false)
          return
        }
      }
    } else {
      if (storageType === 'supabase_file' && !uploadedFileUrl && !selectedFile) {
        setError('Please select a file (PDF, DOCX, ZIP) to upload.')
        setIsPending(false)
        return
      }
    }

    const formData = new FormData(e.currentTarget)
    
    // Pass pre-uploaded file metadata for instant DB save
    if (uploadedFileUrl) {
      formData.set('file_url', uploadedFileUrl)
      formData.set('file_size', uploadedFileSize)
      formData.set('file_format', uploadedFileFormat)
      formData.set('file_name', uploadedFileName)
    }

    // Prepare structured units data payload
    if (resourceType === 'syllabus') {
      const serializableUnits = units.map((u, idx) => ({
        id: u.id,
        unit_number: idx + 1,
        title: u.title.trim() || `Unit ${idx + 1}`,
        description: u.description.trim() || null,
        sort_order: idx + 1,
        topics: u.topics.map((t, tIdx) => ({
          id: t.id,
          title: t.title.trim(),
          description: t.description || null,
          sort_order: tIdx + 1,
        })),
      }))
      formData.set('units_data', JSON.stringify(serializableUnits))
      formData.set('type', 'syllabus')
      if (!formData.get('title') || !(formData.get('title') as string).trim()) {
        formData.set('title', `${selectedSubject?.name || 'Subject'} Syllabus`)
      }
      if (!showOptionalSyllabusFile) {
        formData.set('storage_type', 'none')
      }
    }

    let result
    if (initialData?.id && resourceType !== 'syllabus') {
      formData.append('id', initialData.id)
      result = await updateResource(formData)
    } else {
      result = await createResource(formData)
    }

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  const defaultSyllabusTitle = selectedSubject ? `${selectedSubject.name} Syllabus` : 'Subject Syllabus'

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/resources" 
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {initialData 
              ? (resourceType === 'syllabus' ? 'Edit Subject Syllabus' : 'Edit Resource') 
              : (resourceType === 'syllabus' ? 'Create Subject Syllabus' : 'Upload Academic Resource')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {resourceType === 'syllabus' 
              ? 'Build structured unit-by-unit topics that students explore directly on the subject syllabus page.'
              : 'Fill in the details below to publish study materials instantly to students.'}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-950/80 border border-red-900 text-red-300 rounded-xl text-sm font-medium flex items-center justify-between shadow-lg shadow-red-950/20">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-xl shadow-2xl">
        {initialData && (
          <>
            <input type="hidden" name="existing_file_url" value={initialData.file_url || ''} />
            <input type="hidden" name="existing_file_size" value={initialData.file_size || ''} />
            <input type="hidden" name="existing_file_format" value={initialData.file_format || ''} />
          </>
        )}
        {initialSyllabusData?.syllabus && (
          <>
            <input type="hidden" name="existing_file_url" value={initialSyllabusData.syllabus.file_url || ''} />
            <input type="hidden" name="existing_file_name" value={initialSyllabusData.syllabus.file_name || ''} />
            <input type="hidden" name="existing_file_path" value={initialSyllabusData.syllabus.file_path || ''} />
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subject Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-1">
              Subject <span className="text-red-400">*</span>
            </label>
            <select 
              name="subject_id" 
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none text-sm font-medium"
            >
              <option value="" disabled>Select Master Subject...</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} {sub.short_name ? `(${sub.short_name})` : ''} {sub.category ? `• ${sub.category}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Category Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-1">
              Resource Category <span className="text-red-400">*</span>
            </label>
            <select 
              name="type" 
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none text-sm font-medium"
            >
              <option value="notes">Notes</option>
              <option value="pyq">PYQ (Past Year Question)</option>
              <option value="video">Video Lecture</option>
              <option value="syllabus">Syllabus (Unit-wise)</option>
              <option value="important_questions">Important Questions</option>
              <option value="ai_resources">AI Summaries / Cheat Sheets</option>
            </select>
          </div>

          {/* Resource Title (For non-syllabus or optional title override for syllabus) */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">
                {resourceType === 'syllabus' ? 'Syllabus Title (Optional)' : 'Resource Title *'}
              </label>
              {resourceType === 'syllabus' && (
                <span className="text-xs text-zinc-500">Defaults to subject name syllabus</span>
              )}
            </div>
            <input 
              name="title" 
              defaultValue={initialData?.title} 
              placeholder={resourceType === 'syllabus' ? defaultSyllabusTitle : 'e.g., Module 1 Complete Notes & Solved Numericals'}
              required={resourceType !== 'syllabus'}
              className="w-full rounded-xl px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
            />
          </div>
        </div>

        {/* Auto Branch / Semester & Publish across branches */}
        {selectedSubject && (
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="bg-indigo-900/60 text-indigo-200 px-3 py-1 rounded-full font-semibold border border-indigo-700/40">
                📍 Auto Branch: {(selectedSubject as any).branches?.name || branches.find(b => b.id === selectedSubject.branch_id)?.name || 'Detected'}
              </span>
              <span className="bg-purple-900/60 text-purple-200 px-3 py-1 rounded-full font-semibold border border-purple-700/40">
                🎓 Semester: {(selectedSubject as any).semesters?.number || semesters.find(s => s.id === selectedSubject.semester_id)?.number || '1'}
              </span>
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
              <input 
                type="checkbox" 
                name="apply_to_all_branches" 
                defaultChecked={true} 
                className="w-4 h-4 mt-0.5 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500" 
              />
              <div>
                <span className="text-sm font-semibold text-indigo-200 block">
                  Publish across all branches teaching "{selectedSubject.name}"
                </span>
                <span className="text-xs text-indigo-300/80">
                  Automatically mirrors this {resourceType === 'syllabus' ? 'syllabus structure' : 'resource'} across CS, IT, ECE, AI, etc. for Semester {(selectedSubject as any).semesters?.number || semesters.find(s => s.id === selectedSubject.semester_id)?.number || '1'}.
                </span>
              </div>
            </label>
          </div>
        )}

        {/* Guidelines / Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Description / Guidelines</label>
          <textarea 
            name="description" 
            defaultValue={initialData?.description} 
            rows={resourceType === 'syllabus' ? 2 : 3}
            placeholder={resourceType === 'syllabus' ? 'Optional general syllabus instructions or textbook guidelines...' : 'Brief description or instructions for students...'}
            className="w-full rounded-xl px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none text-sm"
          />
        </div>

        {/* ========================================================================= */}
        {/* CONDITIONAL RENDER: SYLLABUS UNIT-WISE EDITOR vs FILE STORAGE UPLOADER    */}
        {/* ========================================================================= */}

        {resourceType === 'syllabus' ? (
          /* ===================================================================== */
          /* 3. NEW ADMIN UI: UNIT-WISE SYLLABUS EDITOR                             */
          /* ===================================================================== */
          <div className="space-y-6 pt-4 border-t border-zinc-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono tracking-widest text-indigo-400 font-semibold uppercase">
                  SYLLABUS STRUCTURE
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                  Build syllabus by units
                </h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                  Add each unit and its complete list of topics. Students will see these units directly on the subject syllabus page.
                </p>
              </div>

              <button
                type="button"
                onClick={addUnit}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <Plus size={16} />
                + Add Unit
              </button>
            </div>

            {/* Units Accordion List */}
            <div className="space-y-4">
              {units.map((unit, uIdx) => (
                <div 
                  key={unit.tempKey}
                  className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl overflow-hidden transition-all duration-200 hover:border-zinc-700/80 shadow-md"
                >
                  {/* Unit Header Bar */}
                  <div className="flex items-center justify-between p-4 bg-zinc-900/60 border-b border-zinc-800/60 select-none">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* Reorder Up/Down */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={uIdx === 0}
                          onClick={() => moveUnit(uIdx, 'up')}
                          title="Move Unit Up"
                          className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={uIdx === units.length - 1}
                          onClick={() => moveUnit(uIdx, 'down')}
                          title="Move Unit Down"
                          className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>

                      {/* Unit Number Badge */}
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800/50 px-2.5 py-1 rounded-md tracking-wider">
                        UNIT {unit.unit_number}
                      </span>

                      {/* Unit Title Preview */}
                      <span className="text-sm font-semibold text-zinc-200 truncate">
                        {unit.title.trim() || `Unit ${unit.unit_number}`}
                      </span>

                      <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
                        • {unit.topics.length} {unit.topics.length === 1 ? 'topic' : 'topics'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => deleteUnit(uIdx)}
                        title="Delete this unit"
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpandUnit(uIdx)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        {unit.isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Unit Body */}
                  {unit.isExpanded && (
                    <div className="p-5 space-y-5">
                      {/* Unit Title Input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                            Unit Title
                          </label>
                          <span className="text-[11px] text-zinc-500">Optional default: Unit {unit.unit_number}</span>
                        </div>
                        <input
                          type="text"
                          value={unit.title}
                          onChange={(e) => updateUnitTitle(uIdx, e.target.value)}
                          placeholder={`e.g., Matrices and Determinants (Default: Unit ${unit.unit_number})`}
                          className="w-full rounded-lg px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                        />
                      </div>

                      {/* Topics Section */}
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
                            <Layers size={14} className="text-indigo-400" />
                            Topics ({unit.topics.length}) <span className="text-red-400">*</span>
                          </label>

                          {/* Toggle between Single Add and Paste Multiple */}
                          <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
                            <button
                              type="button"
                              onClick={() => setUnits(prev => prev.map((u, i) => i === uIdx ? { ...u, bulkMode: false } : u))}
                              className={`px-2.5 py-1 rounded-md font-medium transition-all ${!unit.bulkMode ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                            >
                              Single Add
                            </button>
                            <button
                              type="button"
                              onClick={() => setUnits(prev => prev.map((u, i) => i === uIdx ? { ...u, bulkMode: true } : u))}
                              className={`px-2.5 py-1 rounded-md font-medium transition-all ${unit.bulkMode ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                            >
                              Paste Multiple
                            </button>
                          </div>
                        </div>

                        {/* Input Box for Adding Topics */}
                        {!unit.bulkMode ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={unit.newTopicText}
                              onChange={(e) => setUnitNewTopicText(uIdx, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addSingleTopic(uIdx)
                                }
                              }}
                              placeholder="Enter topic name (Press Enter or click + Add)..."
                              className="flex-1 rounded-lg px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => addSingleTopic(uIdx)}
                              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1"
                            >
                              <Plus size={15} /> Add
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/80">
                            <p className="text-xs text-zinc-400">
                              Paste topics below, one per line. Leading numbers or dashes will be cleaned automatically:
                            </p>
                            <textarea
                              rows={4}
                              value={unit.bulkText}
                              onChange={(e) => setUnitBulkText(uIdx, e.target.value)}
                              placeholder={`Matrices\nTypes of Matrices\nMatrix Operations\nDeterminants\nProperties of Determinants`}
                              className="w-full rounded-lg px-3 py-2 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs font-mono"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => toggleBulkMode(uIdx)}
                                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => applyBulkTopics(uIdx)}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow"
                              >
                                Convert & Add Topics
                              </button>
                            </div>
                          </div>
                        )}

                        {/* List of Added Topics */}
                        {unit.topics.length === 0 ? (
                          <div className="p-4 rounded-lg border border-dashed border-zinc-800 text-center text-xs text-zinc-500 bg-zinc-900/30">
                            No topics added to Unit {unit.unit_number} yet. Type a topic above or paste multiple topics.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                            {unit.topics.map((topic, tIdx) => (
                              <div 
                                key={topic.tempKey}
                                className="group flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/70 hover:border-zinc-700 transition-colors text-xs text-zinc-200"
                              >
                                <div className="flex items-center gap-2.5 flex-1 mr-2 overflow-hidden">
                                  <span className="text-zinc-500 font-mono text-[11px] w-5 shrink-0 text-right">
                                    {tIdx + 1}.
                                  </span>
                                  <input
                                    type="text"
                                    value={topic.title}
                                    onChange={(e) => updateTopicTitle(uIdx, tIdx, e.target.value)}
                                    className="bg-transparent border-none p-0 text-white focus:outline-none focus:underline w-full truncate"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => deleteTopic(uIdx, tIdx)}
                                  className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors"
                                  title="Remove topic"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Optional Unit Guidelines */}
                      <div className="space-y-1 pt-1">
                        <label className="text-xs font-medium text-zinc-400">
                          Unit Description / Optional Guidelines
                        </label>
                        <input
                          type="text"
                          value={unit.description}
                          onChange={(e) => updateUnitDescription(uIdx, e.target.value)}
                          placeholder="e.g., Study matrix operations before moving to determinants..."
                          className="w-full rounded-lg px-3 py-2 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Add Unit button */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={addUnit}
                className="w-full py-3 rounded-xl border border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-950/40 hover:bg-zinc-900 text-xs font-semibold text-zinc-400 hover:text-indigo-300 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> + Add Another Unit
              </button>
            </div>

            {/* Collapsible Optional Syllabus PDF / External Link Reference */}
            <div className="mt-8 pt-6 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setShowOptionalSyllabusFile(!showOptionalSyllabusFile)}
                className="flex items-center justify-between w-full p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-left text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={16} className="text-indigo-400" />
                  <div>
                    <span className="font-semibold text-white block">Additional Syllabus Document / File (Optional)</span>
                    <span className="text-zinc-500 text-[11px]">Attach an official university PDF or link for students to download alongside the unit topics.</span>
                  </div>
                </div>
                <div className="text-zinc-400">
                  {showOptionalSyllabusFile ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {showOptionalSyllabusFile && (
                <div className="mt-4 p-5 rounded-xl border border-zinc-800 bg-zinc-950/70 space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'supabase_file', label: 'Upload PDF', icon: UploadCloud },
                      { id: 'google_drive', label: 'Google Drive', icon: HardDrive },
                      { id: 'external_link', label: 'External Link', icon: ExternalLink },
                    ].map(tab => {
                      const Icon = tab.icon
                      const isSelected = storageType === tab.id
                      return (
                        <button
                          type="button"
                          key={tab.id}
                          onClick={() => setStorageType(tab.id)}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Icon size={14} className={isSelected ? 'text-indigo-400' : 'text-zinc-500'} />
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                  <input type="hidden" name="storage_type" value={storageType} />

                  {storageType === 'supabase_file' && (
                    <div className="space-y-3">
                      {isUploading && (
                        <div className="p-4 rounded-xl bg-zinc-900 border border-indigo-500/40 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-white font-medium">
                              <Loader2 size={16} className="animate-spin text-indigo-400" />
                              <span className="truncate max-w-[200px]">{uploadedFileName || selectedFile?.name}</span>
                            </div>
                            <span className="text-indigo-400 font-mono">{uploadBytesStatus || `${uploadProgress}%`}</span>
                          </div>
                          <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                            <div
                              className="bg-indigo-500 h-full rounded-full transition-all duration-150"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {uploadError && !isUploading && (
                        <div className="p-3 rounded-xl bg-red-950/50 border border-red-900/50 text-xs text-red-400 flex items-center justify-between">
                          <span>{uploadError}</span>
                          <button
                            type="button"
                            onClick={() => syllabusFileInputRef.current?.click()}
                            className="underline hover:text-red-300 ml-2"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                      {uploadedFileUrl && !isUploading && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-emerald-500/30 text-xs">
                          <div className="flex items-center gap-2">
                            <FileText size={18} className="text-emerald-400 shrink-0" />
                            <div>
                              <div className="font-semibold text-white truncate max-w-[200px]">
                                {uploadedFileName || 'Syllabus Document'}
                              </div>
                              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                                <span>{uploadedFileSize}</span>
                                <span>•</span>
                                <a href={uploadedFileUrl} target="_blank" rel="noreferrer" className="text-indigo-400 underline">
                                  View File
                                </a>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={cancelUpload}
                            className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Remove file"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}

                      {!uploadedFileUrl && !isUploading && (
                        <label htmlFor="syllabus-dropzone-file" className="flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-zinc-900/50 hover:bg-zinc-800/80 transition-all p-4">
                          <div className="text-center">
                            <UploadCloud className="w-6 h-6 mb-1.5 text-indigo-400 mx-auto" />
                            <p className="text-xs text-zinc-300 font-medium">Click to upload syllabus PDF (Max 100MB)</p>
                          </div>
                        </label>
                      )}

                      <input 
                        ref={syllabusFileInputRef}
                        id="syllabus-dropzone-file" 
                        type="file" 
                        accept=".pdf,.docx,.zip"
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files?.[0]) uploadFileWithProgress(e.target.files[0])
                        }}
                      />
                    </div>
                  )}

                  {storageType === 'google_drive' && (
                    <input 
                      name="drive_url" 
                      defaultValue={initialSyllabusData?.syllabus?.file_url || initialData?.drive_url} 
                      placeholder="https://drive.google.com/file/d/..." 
                      className="w-full rounded-lg px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs" 
                    />
                  )}

                  {storageType === 'external_link' && (
                    <input 
                      name="external_url" 
                      defaultValue={initialSyllabusData?.syllabus?.file_url || initialData?.external_url} 
                      placeholder="https://university.edu/syllabus.pdf" 
                      className="w-full rounded-lg px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs" 
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* STANDARD RESOURCE UPLOADER (NOTES, PYQ, VIDEOS, ETC.)                 */
          /* ===================================================================== */
          <div className="space-y-6 pt-4 border-t border-zinc-800/80">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Storage Location <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'supabase_file', label: 'Supabase File', icon: UploadCloud },
                  { id: 'google_drive', label: 'Google Drive', icon: HardDrive },
                  { id: 'youtube', label: 'YouTube Video', icon: Video },
                  { id: 'external_link', label: 'External Link', icon: ExternalLink },
                ].map(tab => {
                  const Icon = tab.icon
                  const isSelected = storageType === tab.id
                  return (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setStorageType(tab.id)}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <Icon size={16} className={isSelected ? 'text-indigo-400' : 'text-zinc-500'} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
              <input type="hidden" name="storage_type" value={storageType} />
            </div>

            <div className="p-6 rounded-xl border border-dashed border-zinc-700/60 bg-zinc-950/60">
              <h3 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                {storageType === 'supabase_file' && <><UploadCloud size={18} className="text-indigo-400" /> Upload File to Supabase Storage</>}
                {storageType === 'google_drive' && <><HardDrive size={18} className="text-emerald-400" /> Google Drive Link Configuration</>}
                {storageType === 'youtube' && <><Video size={18} className="text-rose-400" /> YouTube Video Integration</>}
                {storageType === 'external_link' && <><ExternalLink size={18} className="text-amber-400" /> External Resource Link</>}
              </h3>
              
              {storageType === 'supabase_file' && (
                <div className="space-y-4">
                  {/* 1. Upload in Progress with Real-Time Progress Bar */}
                  {isUploading && (
                    <div className="p-6 rounded-2xl bg-zinc-900/90 border border-indigo-500/40 backdrop-blur-xl space-y-4 shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl animate-pulse">
                            <Loader2 size={28} className="animate-spin" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-base truncate max-w-xs sm:max-w-md">
                              {uploadedFileName || selectedFile?.name || 'Uploading file...'}
                            </div>
                            <div className="text-xs text-indigo-400 font-mono mt-1">
                              {uploadBytesStatus || `${uploadProgress}% uploading to Supabase Storage...`}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={cancelUpload}
                          className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                          title="Cancel Upload"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Animated Gradient Progress Bar */}
                      <div className="w-full bg-zinc-950 rounded-full h-3 overflow-hidden p-0.5 border border-zinc-800">
                        <div
                          className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-150 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                          style={{ width: `${Math.max(uploadProgress, 4)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. Upload Error with Retry */}
                  {uploadError && !isUploading && (
                    <div className="p-4 rounded-xl bg-red-950/50 border border-red-900/50 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5 text-red-400">
                        <AlertCircle size={20} className="shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-200 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw size={13} /> Retry
                      </button>
                    </div>
                  )}

                  {/* 3. Uploaded File Ready State */}
                  {uploadedFileUrl && !isUploading && (
                    <div className="p-5 rounded-2xl bg-zinc-900/90 border border-emerald-500/40 backdrop-blur-xl flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                          <FileText size={28} />
                        </div>
                        <div>
                          <div className="font-bold text-white text-base flex items-center gap-2.5">
                            <span className="truncate max-w-[200px] sm:max-w-sm md:max-w-md">
                              {uploadedFileName || 'Uploaded File'}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase tracking-wider">
                              <CheckCircle2 size={13} /> Ready
                            </span>
                          </div>
                          <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                            {uploadedFileSize && <span>{uploadedFileSize}</span>}
                            {uploadedFileFormat && <span>• {uploadedFileFormat}</span>}
                            <span>•</span>
                            <a
                              href={uploadedFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                            >
                              Preview / Download
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-medium px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl transition-colors"
                        >
                          Change File
                        </button>
                        <button
                          type="button"
                          onClick={cancelUpload}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-colors"
                          title="Remove File"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. Dropzone for file selection */}
                  {!uploadedFileUrl && !isUploading && (
                    <label
                      htmlFor="dropzone-file"
                      className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-indigo-500/50 transition-all p-6 group"
                    >
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all mb-3 text-indigo-400">
                          <UploadCloud size={30} />
                        </div>
                        <p className="mb-1 text-sm text-zinc-300">
                          <span className="font-semibold text-indigo-400">Click to choose file</span> or drag & drop
                        </p>
                        <p className="text-xs text-zinc-500">Supports PDF, DOCX, ZIP, PPTX, JPG, PNG (Max 100MB)</p>
                      </div>
                    </label>
                  )}

                  <input 
                    ref={fileInputRef}
                    id="dropzone-file" 
                    type="file" 
                    accept=".pdf,.docx,.doc,.zip,.pptx,.ppt,.jpg,.jpeg,.png,.txt"
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) uploadFileWithProgress(e.target.files[0])
                    }}
                  />
                </div>
              )}

              {storageType === 'google_drive' && (
                <div className="space-y-2">
                  <input 
                    name="drive_url" 
                    defaultValue={initialData?.drive_url} 
                    placeholder="https://drive.google.com/file/d/..." 
                    className="w-full rounded-lg px-4 py-3 bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 text-sm" 
                  />
                  <p className="text-xs text-zinc-400">
                    💡 Note: Make sure sharing access is set to <span className="text-emerald-400 font-medium">"Anyone with the link can view"</span> on Google Drive.
                  </p>
                </div>
              )}

              {storageType === 'youtube' && (
                <div className="space-y-4">
                  <input 
                    name="youtube_url" 
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..." 
                    className="w-full rounded-lg px-4 py-3 bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 text-sm" 
                  />
                  {youtubeVideoId && (
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                      <img 
                        src={`https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`} 
                        alt="Video Thumbnail Preview" 
                        className="w-28 h-16 object-cover rounded-lg bg-zinc-950"
                      />
                      <div>
                        <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Video ID Detected: {youtubeVideoId}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">
                          High-res thumbnail will be automatically generated and displayed as a preview card inside the app.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {storageType === 'external_link' && (
                <div className="space-y-2">
                  <input 
                    name="external_url" 
                    defaultValue={initialData?.external_url} 
                    placeholder="https://example.com/study-material" 
                    className="w-full rounded-lg px-4 py-3 bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 text-sm" 
                  />
                  <p className="text-xs text-zinc-400">
                    Students will be able to open this web link directly inside the app browser.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sort Order & Visibility Active Toggle */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Sort Order / Priority</label>
            <input 
              type="number" 
              name="sort_order" 
              defaultValue={initialData?.sort_order || 0} 
              className="w-full rounded-lg px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-sm"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input type="checkbox" name="is_active" defaultChecked={initialData ? initialData.is_active : true} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm"></div>
              </div>
              <span className="text-sm font-medium text-zinc-300">Active & Visible in App</span>
            </label>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="pt-4 flex items-center justify-between border-t border-zinc-800/60">
          <Link
            href="/dashboard/resources"
            className="px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-medium"
          >
            Cancel
          </Link>

          <button 
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
          >
            {isPending ? 'Saving...' : (
              <>
                <Save size={18} /> 
                {resourceType === 'syllabus' 
                  ? (initialData || initialSyllabusData ? 'Save Syllabus' : 'Save Syllabus')
                  : (initialData ? 'Update Resource' : 'Publish Resource')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
