'use client'

import { useState } from 'react'
import { FileUpload } from '../FileUpload'
import { FontBrowser } from '../FontBrowser'
import { Type } from 'lucide-react'

interface FrontCardSectionProps {
  formData: any
  updateField: (field: string, value: any) => void
  updateAppearance: (field: string, value: any) => void
}

export function FrontCardSection({
  formData,
  updateField,
  updateAppearance,
}: FrontCardSectionProps) {
  const appearance = formData.appearance || {}
  const [isFontBrowserOpen, setIsFontBrowserOpen] = useState(false)

  const currentFont = appearance.titleFontFamily || 'system-ui'
  const currentColor = appearance.titleColor || '#000000'

  return (
    <div className="space-y-3">
      {/* Sticker/Icon */}
      <FileUpload
        label="Sticker (PNG)"
        value={formData.iconKey || ''}
        onChange={(url) => updateField('iconKey', url)}
        type="sticker"
      />

      {/* Title Font */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title Font
        </label>
        <button
          type="button"
          onClick={() => setIsFontBrowserOpen(true)}
          className="w-full px-4 py-3 pt-3.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
          style={{ paddingTop: '0.875rem' }}
        >
          <span style={{ fontFamily: currentFont === 'system-ui' ? 'system-ui' : `"${currentFont}"` }}>
            {currentFont === 'system-ui' ? 'System Default' : currentFont}
          </span>
          <Type className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Font Browser Modal */}
      <FontBrowser
        isOpen={isFontBrowserOpen}
        onClose={() => setIsFontBrowserOpen(false)}
        currentFont={currentFont}
        currentColor={currentColor}
        onSelectFont={(font) => updateAppearance('titleFontFamily', font)}
        onSelectColor={(color) => updateAppearance('titleColor', color)}
        label="Select Title Font"
      />

      {/* Short Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Short Description
        </label>
        <textarea
          value={formData.shortDescription || ''}
          onChange={(e) => updateField('shortDescription', e.target.value)}
          rows={3}
          maxLength={150}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Brief description for front of card"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {(formData.shortDescription || '').length}/150 characters
        </p>
      </div>
    </div>
  )
}

