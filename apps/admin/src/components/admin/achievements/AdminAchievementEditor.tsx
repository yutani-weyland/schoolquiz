'use client'

import { Save, X, FileText, Image as ImageIcon, Sparkles, Layers, Settings } from 'lucide-react'
import { useAchievementForm } from './useAchievementForm'
import { AchievementFormProvider } from './AchievementFormContext'
import { AccordionSection } from './AccordionSection'
import { BasicsSection } from './sections/BasicsSection'
import { UnlockLogicSection } from './sections/UnlockLogicSection'
import { RarityPresetSection } from './sections/RarityPresetSection'
import { FrontCardSection } from './sections/FrontCardSection'
import { BackCardSection } from './sections/BackCardSection'
import { BackgroundSection } from './sections/BackgroundSection'
import { EffectTogglesSection } from './sections/EffectTogglesSection'
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
    updateField,
    updateAppearance,
    updateConditionConfig,
    isSaving,
    saveAchievement,
  } = providedFormHook || defaultFormHook

  const handleSave = async () => {
    const success = await saveAchievement()
    if (success) {
      onSave()
    }
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 h-full flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
      {/* Header with Actions */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Achievement Settings
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Form with Collapsible Sections */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="w-full space-y-3">
          {/* Basics */}
          <AccordionSection
            title="Basics"
            icon={<FileText className="w-4 h-4" />}
            defaultOpen={true}
          >
            <BasicsSection formData={formData} updateField={updateField} />
          </AccordionSection>

          {/* Rarity */}
          <AccordionSection
            title="Rarity"
            icon={<Sparkles className="w-4 h-4" />}
            defaultOpen={true}
          >
            <RarityPresetSection
              formData={formData}
              updateField={updateField}
              updateAppearance={updateAppearance}
            />
          </AccordionSection>

          {/* Background */}
          <AccordionSection
            title="Background"
            icon={<ImageIcon className="w-4 h-4" />}
            defaultOpen={true}
          >
            <BackgroundSection
              formData={formData}
              updateAppearance={updateAppearance}
            />
          </AccordionSection>

          {/* Front Card */}
          <AccordionSection
            title="Front Card"
            icon={<Layers className="w-4 h-4" />}
            defaultOpen={true}
          >
            <FrontCardSection
              formData={formData}
              updateField={updateField}
              updateAppearance={updateAppearance}
            />
          </AccordionSection>

          {/* Back Card */}
          <AccordionSection
            title="Back Card"
            icon={<Layers className="w-4 h-4" />}
          >
            <BackCardSection
              formData={formData}
              updateField={updateField}
              updateAppearance={updateAppearance}
            />
          </AccordionSection>

          {/* Effects */}
          <AccordionSection
            title="Effects"
            icon={<Sparkles className="w-4 h-4" />}
          >
            <EffectTogglesSection
              formData={formData}
              updateField={updateField}
            />
          </AccordionSection>

          {/* Unlock Logic */}
          <AccordionSection
            title="Unlock Logic"
            icon={<Settings className="w-4 h-4" />}
          >
            <UnlockLogicSection
              formData={formData}
              updateField={updateField}
              updateConditionConfig={updateConditionConfig}
            />
          </AccordionSection>

          {/* Settings */}
          <AccordionSection
            title="Settings"
            icon={<Settings className="w-4 h-4" />}
          >
            <MetaSection formData={formData} updateField={updateField} />
          </AccordionSection>
        </div>
      </div>
    </div>
  )
}

