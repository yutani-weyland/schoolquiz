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

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    // Upload file
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/admin/achievements/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = 'Upload failed'
        try {
          const error = await response.json()
          errorMessage = error.error || error.details || errorMessage
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            const text = await response.text()
            errorMessage = text || errorMessage
          } catch (e2) {
            // Ignore
          }
        }
        throw new Error(errorMessage)
      }

      let data
      try {
        data = await response.json()
      } catch (error) {
        throw new Error('Invalid response from server')
      }

      if (!data || !data.url) {
        throw new Error('Invalid response: missing URL')
      }

      onChange(data.url)
      setPreview(data.url)
    } catch (error: any) {
      console.error('Upload error:', error)
      const errorMessage = error.message || 'Unknown error occurred'
      console.error('Full error details:', {
        message: errorMessage,
        stack: error.stack,
        name: error.name,
      })
      alert(`Failed to upload: ${errorMessage}\n\nCheck the browser console for more details.`)
      setPreview(value || null)
      // Clean up object URL on error
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    } finally {
      setIsUploading(false)
      // Clean up object URL
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    }
  }

  const handleRemove = () => {
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

