'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

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
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // For now, use local blob URL - no server upload needed
    setIsUploading(true)
    try {
      // Create a blob URL for local use
      const blobUrl = URL.createObjectURL(file)
      setPreview(blobUrl)
      
      // Use the blob URL as the value
      // Note: blob URLs are temporary and only work in the current browser session
      // For production, you'll want to upload to a server and get a permanent URL
      onChange(blobUrl)
    } catch (error: any) {
      console.error('File selection error:', error)
      alert(`Failed to load file: ${error.message || 'Unknown error'}`)
      setPreview(value || null)
    } finally {
      setIsUploading(false)
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
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className={`${iconSize} text-white animate-spin`} />
              </div>
            )}
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className={`absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <X className={iconSizeSmall} />
            </button>
          </div>
          {!compact && (
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              {value || 'Uploaded'}
            </p>
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
                  PNG, JPG, or WebP (max 5MB)
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

