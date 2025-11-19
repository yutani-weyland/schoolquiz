'use client'

interface MetaSectionProps {
  formData: any
  updateField: (field: string, value: any) => void
}

export function MetaSection({ formData, updateField }: MetaSectionProps) {
  return (
    <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => updateField('isActive', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Active (visible to users)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isPremiumOnly}
            onChange={(e) => updateField('isPremiumOnly', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Premium Only
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Season / Year / Collection
          </label>
          <input
            type="text"
            value={formData.seasonTag || ''}
            onChange={(e) => updateField('seasonTag', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="e.g., olympics-2026, halloween-2025"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Series / Collection Name
          </label>
          <input
            type="text"
            value={formData.series || ''}
            onChange={(e) => updateField('series', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="e.g., Roman History, Perfect Scores"
          />
        </div>
    </div>
  )
}

