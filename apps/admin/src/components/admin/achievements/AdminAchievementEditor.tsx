'use client'

import { X, Settings } from 'lucide-react'
import { useAchievementForm } from './useAchievementForm'
import { AchievementFormProvider } from './AchievementFormContext'
import { AccordionSection } from './AccordionSection'
import { MetaSection } from './sections/MetaSection'

interface AdminAchievementEditorProps {
  achievement?: {
    id: string
    slug: string
    name: string
    shortDescription: string
    longDescription?: string | null
    category: string
    rarity: string
    isPremiumOnly: boolean
    seasonTag?: string | null
    iconKey?: string | null
    unlockConditionType: string
    unlockConditionConfig?: string | null
    appearance?: string | null
    isActive: boolean
    points?: number | null
    series?: string | null
    cardVariant?: string | null
  } | null
  onSave: () => void
  onCancel: () => void
  formHook?: ReturnType<typeof useAchievementForm>
}

export function AdminAchievementEditor({
  achievement,
  onSave,
  onCancel,
  formHook: providedFormHook,
}: AdminAchievementEditorProps) {
  const defaultFormHook = useAchievementForm(achievement)
  const {
    formData,
    updateField: originalUpdateField,
    updateAppearance,
    isSaving,
    saveAchievement,
  } = providedFormHook || defaultFormHook
  
  // Cast updateField to accept string for section components
  const updateField = originalUpdateField as (field: string, value: any) => void

  const handleSave = async () => {
    const success = await saveAchievement()
    if (success) {
      onSave()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Settings
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <MetaSection formData={formData} updateField={updateField} />
      </div>
    </div>
  )
}

