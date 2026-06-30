'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { createProduct, updateProduct } from '@/app/dashboard/products/actions'

export default function ProductForm({ initialData }: { initialData?: any }) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(initialData?.thumbnail_url || '')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [requiresFileUpload, setRequiresFileUpload] = useState<boolean>(initialData?.requires_file_upload ?? false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, WebP, GIF, or SVG image.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 150)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-product', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      clearInterval(progressInterval)
      setUploadProgress(100)
      setThumbnailUrl(result.url)

      setTimeout(() => setUploadProgress(0), 500)
    } catch (err: any) {
      clearInterval(progressInterval)
      setError(err.message || 'Failed to upload image')
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }, [])

  const removeImage = () => {
    setThumbnailUrl('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('thumbnail_url', thumbnailUrl)
    formData.set('requires_file_upload', requiresFileUpload ? 'on' : 'off')

    let result
    if (initialData?.id) {
      formData.append('id', initialData.id)
      result = await updateProduct(formData)
    } else {
      result = await createProduct(formData)
    }

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/products" 
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {initialData ? 'Edit Product' : 'New Product'}
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-900/50 text-red-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-zinc-300">Title <span className="text-red-400">*</span></label>
            <input 
              name="title" 
              defaultValue={initialData?.title} 
              required 
              placeholder="e.g. Complete Web Dev Notes"
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-zinc-300">Description</label>
            <textarea 
              name="description" 
              defaultValue={initialData?.description} 
              rows={3}
              placeholder="Detailed description of what the product includes..."
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Price (in INR) <span className="text-red-400">*</span></label>
            <input 
              type="number"
              name="price" 
              defaultValue={initialData?.price ?? 0} 
              required
              min={0}
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Category <span className="text-red-400">*</span></label>
            <select 
              name="category" 
              defaultValue={initialData?.category || 'notes'} 
              required
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="notes">Notes</option>
              <option value="project">Project Help</option>
              <option value="assignment">Assignment Support</option>
              <option value="lab_manual">Lab Manual</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Product Image Upload */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-zinc-300">Product Thumbnail</label>
            
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" 
              onChange={handleFileSelect}
              className="hidden"
            />
            <input type="hidden" name="thumbnail_url" value={thumbnailUrl} />

            {thumbnailUrl ? (
              <div className="relative group rounded-xl overflow-hidden border border-zinc-700/50 bg-zinc-950">
                <img 
                  src={thumbnailUrl} 
                  alt="Thumbnail preview" 
                  className="w-full h-48 md:h-56 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Upload size={16} />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <X size={16} />
                    Remove
                  </button>
                </div>
                <div className="p-3 bg-zinc-900/90 border-t border-zinc-800/50">
                  <p className="text-xs text-zinc-500 truncate">
                    <span className="text-zinc-400 font-medium">URL:</span> {thumbnailUrl}
                  </p>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200
                  ${isDragging 
                    ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' 
                    : 'border-zinc-700 bg-zinc-950/50 hover:border-zinc-600 hover:bg-zinc-900/50'
                  }
                  ${isUploading ? 'pointer-events-none opacity-70' : ''}
                `}
              >
                {isUploading ? (
                  <div className="space-y-4">
                    <Loader2 className="mx-auto text-indigo-400 animate-spin" size={40} />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-zinc-300">Uploading...</p>
                      <div className="w-48 mx-auto bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500">{uploadProgress}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-zinc-800/80 flex items-center justify-center">
                      <ImageIcon className="text-zinc-500" size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-300">
                        {isDragging ? 'Drop your image here' : 'Click to upload or drag & drop'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        JPEG, PNG, WebP, GIF, or SVG • Max 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checkout Requirements Options */}
          <div className="space-y-4 md:col-span-2 bg-zinc-950/50 p-5 rounded-xl border border-zinc-800">
            <h3 className="text-sm font-semibold text-white">Order Checkout Flow Options</h3>
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={requiresFileUpload} 
                onChange={(e) => setRequiresFileUpload(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-zinc-200 block">Require Product Images / File Upload</span>
                <span className="text-xs text-zinc-400">When enabled: Automatically shows the Guidelines page before checkout and requires mandatory image/file upload. When disabled: Skips guidelines & upload, using standard checkout flow.</span>
              </div>
            </label>

            {requiresFileUpload && (
              <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                <label className="text-xs font-medium text-zinc-400">Instructions for User Upload</label>
                <textarea 
                  name="upload_instructions" 
                  defaultValue={initialData?.upload_instructions} 
                  rows={2}
                  placeholder="e.g. Please upload your assignment PDF or questions picture here."
                  className="w-full rounded-lg px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
              </div>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-zinc-300">Drive Link (Fulfillment)</label>
            <input 
              name="drive_link" 
              defaultValue={initialData?.drive_link} 
              placeholder="Google Drive link to grant access to buyers..."
              className="w-full rounded-lg px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-zinc-800/50">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                name="is_active" 
                defaultChecked={initialData ? initialData.is_active : true} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm"></div>
            </div>
            <span className="text-sm font-medium text-zinc-300">Active / Visible</span>
          </label>

          <button 
            disabled={isPending || isUploading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            {isPending ? 'Saving...' : (
              <>
                <Save size={18} />
                Save Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
