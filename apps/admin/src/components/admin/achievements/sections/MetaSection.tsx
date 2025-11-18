'use client'

interface MetaSectionProps {
  formData: any
  updateField: (field: string, value: any) => void
}

export function MetaSection({ formData, updateField }: MetaSectionProps) {
  return (
    <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => updateField('isActive', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active (visible to users)
            </span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isPremiumOnly}
              onChange={(e) => updateField('isPremiumOnly', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Premium Only
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Season / Year / Collection
          </label>
          <input
            type="text"
            value={formData.seasonTag || ''}
            onChange={(e) => updateField('seasonTag', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., olympics-2026, halloween-2025, 2024"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Organize achievements by season, year, or collection
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Series / Collection Name
          </label>
          <input
            type="text"
            value={formData.series || ''}
            onChange={(e) => updateField('series', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Roman History, Perfect Scores, Speed Run"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Group related achievements together
          </p>
        </div>
    </div>
  )
}

