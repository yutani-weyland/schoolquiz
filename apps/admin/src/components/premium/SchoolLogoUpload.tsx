'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react'
import { optimizeImage, validateImageFile, type OptimizedImage } from '@/lib/image-optimization'
import { getAuthToken, getUserId } from '@/lib/storage'

interface SchoolLogoUploadProps {
  value?: string
  onChange: (url: string) => void
  className?: string
  compact?: boolean
}

export function SchoolLogoUpload({
  value,
  onChange,
  className = '',
  compact = false,
}: SchoolLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Validate file
      const validation = validateImageFile(file)
      if (!validation.valid) {
        setError(validation.error || 'Invalid file')
        return
      }

      // Check dimensions (should be square or reasonable aspect ratio)
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = e.target?.result as string
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Warn if not square (but allow it)
      const aspectRatio = img.width / img.height
      if (aspectRatio < 0.8 || aspectRatio > 1.2) {
        console.warn('Logo is not square - recommended for best results')
      }

      // Check max dimensions
      if (img.width > 512 || img.height > 512) {
        setError('Logo dimensions too large. Maximum: 512x512px')
        return
      }

      setUploadProgress(10)

      let fileToUpload: File
      let previewUrl: string

      // SVG files don't need optimization
      if (file.type === 'image/svg+xml') {
        previewUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        fileToUpload = file
        setUploadProgress(30)
      } else {
        // Optimize image - keep it small for logos
        const options = {
          maxWidth: 512,
          maxHeight: 512,
          maxSizeMB: 1, // Smaller for logos
          quality: 0.9, // Higher quality for logos
          format: 'webp' as const,
        }

        setUploadProgress(20)
        const optimized: OptimizedImage = await optimizeImage(file, options)
        previewUrl = optimized.preview
        fileToUpload = optimized.file
        setUploadProgress(40)
      }

      setPreview(previewUrl)
      setUploadProgress(50)

      // Upload to server
      const formData = new FormData()
      formData.append('file', fileToUpload)

      setUploadProgress(60)
      const token = getAuthToken()
      const userId = getUserId()

      if (!token || !userId) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/premium/custom-quizzes/upload-logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId,
        },
        body: formData,
      })

      setUploadProgress(80)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload logo')
      }

      const data = await response.json()
      setUploadProgress(100)

      // Use the uploaded URL
      setPreview(data.url)
      onChange(data.url)
    } catch (error: any) {
      console.error('Logo upload error:', error)
      setError(error.message || 'Failed to upload logo')
      setPreview(value || null)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemove = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
    onChange('')
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const height = compact ? 'h-20' : 'h-32'
  const iconSize = compact ? 'w-5 h-5' : 'w-6 h-6'
  const textSize = compact ? 'text-xs' : 'text-sm'

  return (
    <div className={className}>
      {!compact && (
        <>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            School Logo / Emblem
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Upload your school logo to appear on quiz PDFs. Recommended: Square format (512x512px max), PNG with transparent background.
          </p>
        </>
      )}
      {compact && (
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Logo
        </label>
      )}

      {error && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {preview ? (
        <div className="relative">
          <div className={`relative w-full ${height} bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center`}>
            <img
              src={preview}
              alt="School logo preview"
              className="max-w-full max-h-full object-contain"
              loading="lazy"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                <Loader2 className={`${iconSize} text-white animate-spin ${compact ? 'mb-1' : 'mb-2'}`} />
                <div className={`${compact ? 'w-24 h-1' : 'w-32 h-1.5'} bg-white/20 rounded-full overflow-hidden`}>
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                {!compact && <p className="mt-2 text-xs text-white">{uploadProgress}%</p>}
              </div>
            )}
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className={`absolute ${compact ? 'top-1 right-1 p-1' : 'top-2 right-2 p-1.5'} bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg`}
            >
              <X className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
            </button>
          </div>
          {!compact && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              Replace logo
            </button>
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
                ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 bg-gray-50 dark:bg-gray-800'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <>
              <Loader2 className={`${iconSize} text-gray-400 animate-spin ${compact ? 'mb-1' : 'mb-2'}`} />
              <p className={`${textSize} text-gray-600 dark:text-gray-400`}>Uploading...</p>
            </>
          ) : (
            <>
              <Upload className={`${iconSize} text-gray-400 ${compact ? 'mb-1' : 'mb-2'}`} />
              <p className={`${textSize} ${compact ? 'text-gray-600 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>
                {compact ? 'Upload logo' : 'Click to upload school logo'}
              </p>
              {!compact && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG, WebP, or SVG (max 2MB, 512x512px)
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

