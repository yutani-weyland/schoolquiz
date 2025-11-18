'use client'

import { FileUpload } from '../FileUpload'

interface IconSectionProps {
  formData: any
  updateField: (field: string, value: any) => void
}

export function IconSection({ formData, updateField }: IconSectionProps) {
  return (
    <div className="space-y-4">
        <FileUpload
          label="Sticker/Icon Image (PNG recommended)"
          value={formData.iconKey || ''}
          onChange={(url) => updateField('iconKey', url)}
          type="sticker"
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Or use Icon Key (emoji or existing path)
          </label>
          <input
            type="text"
            value={formData.iconKey || ''}
            onChange={(e) => updateField('iconKey', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 🏆 or /achievements/blitzkreig.png"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Upload a PNG sticker above, or enter an emoji/emoji key, or path to existing image
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Card Variant
          </label>
          <select
            value={formData.cardVariant || 'standard'}
            onChange={(e) => updateField('cardVariant', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="standard">Standard</option>
            <option value="foil">Foil</option>
            <option value="foilGold">Foil Gold</option>
            <option value="foilSilver">Foil Silver</option>
            <option value="shiny">Shiny</option>
            <option value="fullArt">Full Art</option>
          </select>
        </div>
    </div>
  )
}

