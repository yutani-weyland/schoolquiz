'use client'

import { useState } from 'react'
import { FontBrowser } from '../FontBrowser'
import { Type } from 'lucide-react'

interface BackCardSectionProps {
  formData: any
  updateField: (field: string, value: any) => void
  updateAppearance: (field: string, value: any) => void
}

export function BackCardSection({
  formData,
  updateField,
  updateAppearance,
}: BackCardSectionProps) {
  const appearance = formData.appearance || {}
  const [isFontBrowserOpen, setIsFontBrowserOpen] = useState(false)

  const currentFont = appearance.bodyFontFamily || 'system-ui'
  const currentColor = appearance.bodyColor || '#000000'

  return (
    <div className="space-y-3">
      {/* Long Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Long Description
        </label>
        <textarea
          value={formData.longDescription || ''}
          onChange={(e) => updateField('longDescription', e.target.value)}
          rows={4}
          maxLength={500}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Detailed description for back of card"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {(formData.longDescription || '').length || 0}/500 characters
        </p>
      </div>

      {/* Body Font */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Body Font
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
        onSelectFont={(font) => updateAppearance('bodyFontFamily', font)}
        onSelectColor={(color) => updateAppearance('bodyColor', color)}
        label="Select Body Font"
      />
    </div>
  )
}

