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
}

export function FileUpload({
  label,
  value,
  onChange,
  type,
  accept = 'image/png,image/jpeg,image/jpg,image/webp',
  className = '',
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

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {preview ? (
        <div className="relative">
          <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {value || 'Uploaded'}
          </p>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`
            relative w-full h-32 border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center
            cursor-pointer transition-colors
            ${
              isUploading
                ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                : 'border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 bg-gray-50 dark:bg-gray-800'
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
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click to upload {type === 'background' ? 'background' : 'sticker'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                PNG, JPG, or WebP (max 5MB)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

