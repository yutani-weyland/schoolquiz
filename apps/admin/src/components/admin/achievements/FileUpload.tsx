'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { optimizeImage, validateImageFile, type OptimizedImage } from '@/lib/image-optimization'

interface FileUploadProps {
  label: string
  value?: string
  onChange: (url: string) => void
  type: 'background' | 'sticker'
  accept?: string
  className?: string
  compact?: boolean
}

export function FileUpload({
  label,
  value,
  onChange,
  type,
  accept = 'image/png,image/jpeg,image/jpg,image/webp',
  className = '',
  compact = false,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [optimizationInfo, setOptimizationInfo] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Validate file
      const validation = validateImageFile(file)
      if (!validation.valid) {
        alert(validation.error || 'Invalid file')
        return
      }

      setUploadProgress(10)

      // Optimize image based on type
      const options = {
        maxWidth: type === 'background' ? 1920 : 512, // Backgrounds larger, stickers smaller
        maxHeight: type === 'background' ? 1920 : 512,
        maxSizeMB: 2,
        quality: 0.85,
        format: 'webp' as const,
      }

      setUploadProgress(20)
      const optimized: OptimizedImage = await optimizeImage(file, options)
      
      // Show optimization info
      const sizeReduction = ((1 - optimized.optimizedSize / optimized.originalSize) * 100).toFixed(0)
      setOptimizationInfo(
        `Optimized: ${(optimized.originalSize / 1024 / 1024).toFixed(1)}MB → ${(optimized.optimizedSize / 1024 / 1024).toFixed(1)}MB (${sizeReduction}% smaller)`
      )

      setPreview(optimized.preview)
      setUploadProgress(50)

      // Upload to server
      const formData = new FormData()
      formData.append('file', optimized.file)
      formData.append('folder', type === 'background' ? 'backgrounds' : 'stickers')

      setUploadProgress(60)
      const response = await fetch('/api/admin/images/upload', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(80)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload image')
      }

      const data = await response.json()
      setUploadProgress(100)

      // Use the uploaded URL
      setPreview(data.url)
      onChange(data.url)

      // Clear optimization info after a moment
      setTimeout(() => setOptimizationInfo(null), 3000)
    } catch (error: any) {
      console.error('File upload error:', error)
      alert(`Failed to upload image: ${error.message || 'Unknown error'}`)
      setPreview(value || null)
      setOptimizationInfo(null)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemove = () => {
    // Clean up blob URL if it exists
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
    onChange('')
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const height = compact ? 'h-20' : 'h-32'
  const iconSize = compact ? 'w-5 h-5' : 'w-8 h-8'
  const textSize = compact ? 'text-xs' : 'text-sm'
  const iconSizeSmall = compact ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      {preview ? (
        <div className="relative">
          <div className={`relative w-full ${height} bg-[hsl(var(--muted))] rounded-lg border border-[hsl(var(--border))] overflow-hidden`}>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
              loading="lazy"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                <Loader2 className={`${iconSize} text-white animate-spin mb-2`} />
                <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-white">{uploadProgress}%</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className={`absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              <X className={iconSizeSmall} />
            </button>
          </div>
          {!compact && (
            <div className="mt-1 space-y-1">
              {optimizationInfo && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  {optimizationInfo}
                </p>
              )}
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {value || 'Uploaded'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`
            relative w-full ${height} border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center
            cursor-pointer transition-colors
            ${
              isUploading
                ? 'border-[hsl(var(--border))] bg-[hsl(var(--muted))]'
                : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] bg-[hsl(var(--muted))]'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <>
              <Loader2 className={`${iconSize} text-[hsl(var(--muted-foreground))] animate-spin mb-1`} />
              <p className={`${textSize} text-[hsl(var(--muted-foreground))]`}>Uploading...</p>
            </>
          ) : (
            <>
              <Upload className={`${iconSize} text-[hsl(var(--muted-foreground))] mb-1`} />
              <p className={`${textSize} text-[hsl(var(--foreground))] text-center px-2`}>
                {compact ? 'Upload' : `Click to upload ${type === 'background' ? 'background' : 'sticker'}`}
              </p>
              {!compact && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  PNG, JPG, or WebP (max 10MB, auto-optimized)
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

