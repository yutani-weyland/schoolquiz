'use client'

interface AppearanceLayoutSectionProps {
  formData: any
  updateAppearance: (field: string, value: any) => void
}

export function AppearanceLayoutSection({
  formData,
  updateAppearance,
}: AppearanceLayoutSectionProps) {
  const appearance = formData.appearance || {}

  return (
    <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Corner Radius (px)
          </label>
          <input
            type="range"
            min="0"
            max="32"
            step="2"
            value={appearance.cornerRadius || 12}
            onChange={(e) =>
              updateAppearance('cornerRadius', parseInt(e.target.value))
            }
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {appearance.cornerRadius || 12}px
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Padding (px)
          </label>
          <input
            type="range"
            min="8"
            max="48"
            step="4"
            value={appearance.padding || 16}
            onChange={(e) => updateAppearance('padding', parseInt(e.target.value))}
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {appearance.padding || 16}px
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Elevation (shadow level)
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="1"
            value={appearance.elevation || 2}
            onChange={(e) => updateAppearance('elevation', parseInt(e.target.value))}
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Level {appearance.elevation || 2}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rotation (degrees, -3 to +3)
          </label>
          <input
            type="range"
            min="-3"
            max="3"
            step="0.5"
            value={appearance.rotationDegrees || 0}
            onChange={(e) =>
              updateAppearance('rotationDegrees', parseFloat(e.target.value))
            }
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {appearance.rotationDegrees || 0}°
          </p>
        </div>
      </div>
    </div>
  )
}

