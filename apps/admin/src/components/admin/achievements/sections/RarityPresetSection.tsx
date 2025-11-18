'use client'

interface RarityPresetSectionProps {
  formData: any
  updateField: (field: string, value: any) => void
  updateAppearance: (field: string, value: any) => void
}

// WoW rarity colors
const WOW_RARITY_COLORS = {
  common: {
    name: 'Common',
    bgColor: '#9D9D9D', // Gray
    textColor: '#FFFFFF',
    description: 'Standard achievement',
  },
  uncommon: {
    name: 'Uncommon',
    bgColor: '#1EFF00', // Green
    textColor: '#FFFFFF',
    description: 'Slightly rare',
  },
  rare: {
    name: 'Rare',
    bgColor: '#0070DD', // Blue
    textColor: '#FFFFFF',
    description: 'Rare achievement',
  },
  epic: {
    name: 'Epic',
    bgColor: '#A335EE', // Purple
    textColor: '#FFFFFF',
    description: 'Very rare',
  },
  legendary: {
    name: 'Legendary',
    bgColor: '#FF8000', // Orange/Gold
    textColor: '#FFFFFF',
    description: 'Extremely rare',
  },
}

export function RarityPresetSection({
  formData,
  updateField,
  updateAppearance,
}: RarityPresetSectionProps) {
  const currentRarity = formData.rarity || 'common'
  const rarityColor = WOW_RARITY_COLORS[currentRarity as keyof typeof WOW_RARITY_COLORS]

  const handleRarityChange = (rarity: string) => {
    updateField('rarity', rarity)
    // Apply WoW color preset
    const preset = WOW_RARITY_COLORS[rarity as keyof typeof WOW_RARITY_COLORS]
    if (preset) {
      updateAppearance('backgroundColor', preset.bgColor)
      updateAppearance('textColorPrimary', preset.textColor)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Rarity Preset
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(WOW_RARITY_COLORS) as Array<keyof typeof WOW_RARITY_COLORS>).map((rarity) => {
            const preset = WOW_RARITY_COLORS[rarity]
            const isSelected = currentRarity === rarity
            return (
              <button
                key={rarity}
                type="button"
                onClick={() => handleRarityChange(rarity)}
                className={`relative inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? 'ring-2 ring-blue-500 ring-offset-2'
                    : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
                }`}
                style={{
                  backgroundColor: preset.bgColor,
                  color: preset.textColor,
                  boxShadow: isSelected ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                }}
                title={preset.description}
              >
                <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                  {preset.name}
                </span>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
        {rarityColor && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {rarityColor.description} • Color: {rarityColor.bgColor}
          </p>
        )}
      </div>
    </div>
  )
}

