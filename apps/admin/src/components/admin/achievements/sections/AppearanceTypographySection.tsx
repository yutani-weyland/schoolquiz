'use client'

interface AppearanceTypographySectionProps {
  formData: any
  updateAppearance: (field: string, value: any) => void
}

export function AppearanceTypographySection({
  formData,
  updateAppearance,
}: AppearanceTypographySectionProps) {
  const appearance = formData.appearance || {}

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title Font Family
            </label>
            <select
              value={appearance.titleFontFamily || 'system-ui'}
              onChange={(e) => updateAppearance('titleFontFamily', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="system-ui">System UI</option>
              <option value="serif">Serif</option>
              <option value="sans-serif">Sans Serif</option>
              <option value="monospace">Monospace</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Body Font Family
            </label>
            <select
              value={appearance.bodyFontFamily || 'system-ui'}
              onChange={(e) => updateAppearance('bodyFontFamily', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="system-ui">System UI</option>
              <option value="serif">Serif</option>
              <option value="sans-serif">Sans Serif</option>
              <option value="monospace">Monospace</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title Casing
          </label>
          <select
            value={appearance.titleCase || 'normal'}
            onChange={(e) => updateAppearance('titleCase', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="normal">Normal</option>
            <option value="upper">UPPERCASE</option>
            <option value="title">Title Case</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title Letter Spacing
          </label>
          <input
            type="range"
            min="-2"
            max="5"
            step="0.5"
            value={appearance.titleLetterSpacing || 0}
            onChange={(e) =>
              updateAppearance('titleLetterSpacing', parseFloat(e.target.value))
            }
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {appearance.titleLetterSpacing || 0}px
          </p>
        </div>
      </div>
    </div>
  )
}

