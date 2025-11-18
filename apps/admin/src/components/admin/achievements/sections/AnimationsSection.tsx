'use client'

interface AnimationsSectionProps {
  formData: any
  updateAppearance: (field: string, value: any) => void
}

export function AnimationsSection({
  formData,
  updateAppearance,
}: AnimationsSectionProps) {
  const appearance = formData.appearance || {}

  return (
    <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Animation Preset
          </label>
          <select
            value={appearance.animationPreset || 'none'}
            onChange={(e) => updateAppearance('animationPreset', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">None</option>
            <option value="pulse">Pulse</option>
            <option value="bounce">Bounce</option>
            <option value="glow">Glow</option>
            <option value="flip">Flip</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={appearance.animationOnHover || false}
              onChange={(e) => updateAppearance('animationOnHover', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Play animation on hover
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={appearance.animationOnUnlock || false}
              onChange={(e) => updateAppearance('animationOnUnlock', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Play animation when unlocked (first time only)
            </span>
          </label>
        </div>
    </div>
  )
}

