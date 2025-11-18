'use client'

import { Sparkles, Zap, Rainbow, Gem, Sun, Moon, Star } from 'lucide-react'

interface EffectTogglesSectionProps {
  formData: any
  updateField: (field: string, value: any) => void
}

const EFFECTS = [
  { 
    id: 'standard', 
    label: 'Standard', 
    description: 'No special effects',
    icon: Sparkles,
    preview: 'bg-gradient-to-br from-gray-100 to-gray-200',
  },
  { 
    id: 'foil', 
    label: 'Holographic Foil', 
    description: 'Rainbow holographic effect',
    icon: Rainbow,
    preview: 'bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300',
  },
  { 
    id: 'foilGold', 
    label: 'Gold Foil', 
    description: 'Luxurious gold finish',
    icon: Sun,
    preview: 'bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500',
  },
  { 
    id: 'foilSilver', 
    label: 'Silver Foil', 
    description: 'Metallic silver finish',
    icon: Moon,
    preview: 'bg-gradient-to-br from-gray-300 via-slate-300 to-gray-400',
  },
  { 
    id: 'prismatic', 
    label: 'Prismatic', 
    description: 'Crystal prism effect',
    icon: Gem,
    preview: 'bg-gradient-to-br from-cyan-300 via-blue-400 to-purple-500',
  },
  { 
    id: 'neon', 
    label: 'Neon Glow', 
    description: 'Electric neon border',
    icon: Zap,
    preview: 'bg-gradient-to-br from-green-400 via-cyan-400 to-blue-500',
  },
  { 
    id: 'shiny', 
    label: 'Shiny', 
    description: 'Glossy shimmer effect',
    icon: Star,
    preview: 'bg-gradient-to-br from-white via-gray-100 to-gray-200',
  },
  { 
    id: 'fullArt', 
    label: 'Full Art', 
    description: 'Borderless full art',
    icon: Sparkles,
    preview: 'bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500',
  },
]

export function EffectTogglesSection({
  formData,
  updateField,
}: EffectTogglesSectionProps) {
  const currentVariant = formData.cardVariant || 'standard'

  const handleEffectToggle = (effectId: string) => {
    updateField('cardVariant', effectId)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Card Effects
        </label>
        <div className="grid grid-cols-2 gap-3">
          {EFFECTS.map((effect) => {
            const Icon = effect.icon
            const isActive = currentVariant === effect.id
            return (
              <button
                key={effect.id}
                type="button"
                onClick={() => handleEffectToggle(effect.id)}
                className={`relative p-3 rounded-xl border-2 transition-all text-left overflow-hidden group ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm'
                }`}
              >
                {/* Visual Preview */}
                <div className={`absolute inset-0 ${effect.preview} opacity-20 group-hover:opacity-30 transition-opacity`} />
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium truncate ${
                        isActive 
                          ? 'text-blue-900 dark:text-blue-100' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {effect.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {effect.description}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ml-2 ${
                      isActive
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {isActive && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Effects are visual overlays that enhance the card's appearance
        </p>
      </div>
    </div>
  )
}
