'use client'

import { FileUpload } from '../FileUpload'

interface AppearanceColorsSectionProps {
  formData: any
  updateAppearance: (field: string, value: any) => void
}

export function AppearanceColorsSection({
  formData,
  updateAppearance,
}: AppearanceColorsSectionProps) {
  const appearance = formData.appearance || {}

  return (
    <div className="space-y-4">
        <FileUpload
          label="Background Image (PNG with transparency)"
          value={appearance.backgroundImage || ''}
          onChange={(url) => updateAppearance('backgroundImage', url)}
          type="background"
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Background Color (fallback if no image)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={appearance.backgroundColor || '#F59E0B'}
              onChange={(e) => updateAppearance('backgroundColor', e.target.value)}
              className="w-16 h-10 border border-gray-300 dark:border-gray-700 rounded cursor-pointer"
            />
            <input
              type="text"
              value={appearance.backgroundColor || '#F59E0B'}
              onChange={(e) => updateAppearance('backgroundColor', e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#F59E0B"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Used as fallback if no background image is uploaded
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gradient From (optional)
            </label>
            <input
              type="text"
              value={appearance.backgroundGradientFrom || ''}
              onChange={(e) =>
                updateAppearance('backgroundGradientFrom', e.target.value || undefined)
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#F59E0B"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gradient To (optional)
            </label>
            <input
              type="text"
              value={appearance.backgroundGradientTo || ''}
              onChange={(e) =>
                updateAppearance('backgroundGradientTo', e.target.value || undefined)
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#F59E0B"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Primary Text Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={appearance.textColorPrimary || '#FFFFFF'}
                onChange={(e) => updateAppearance('textColorPrimary', e.target.value)}
                className="w-16 h-10 border border-gray-300 dark:border-gray-700 rounded cursor-pointer"
              />
              <input
                type="text"
                value={appearance.textColorPrimary || '#FFFFFF'}
                onChange={(e) => updateAppearance('textColorPrimary', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Secondary Text Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={appearance.textColorSecondary || '#FFFFFF'}
                onChange={(e) => updateAppearance('textColorSecondary', e.target.value)}
                className="w-16 h-10 border border-gray-300 dark:border-gray-700 rounded cursor-pointer"
              />
              <input
                type="text"
                value={appearance.textColorSecondary || '#FFFFFF'}
                onChange={(e) => updateAppearance('textColorSecondary', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pattern Opacity (0-1)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={appearance.patternOpacity || 0}
            onChange={(e) =>
              updateAppearance('patternOpacity', parseFloat(e.target.value))
            }
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {appearance.patternOpacity || 0}
          </p>
        </div>
      </div>
    </div>
  )
}

