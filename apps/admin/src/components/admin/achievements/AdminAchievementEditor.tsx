'use client'

import { Save, X, FileText, Palette, Type, Layout, Image, Zap, Settings } from 'lucide-react'
import { useAchievementForm } from './useAchievementForm'
import { AchievementFormProvider } from './AchievementFormContext'
import { AccordionSection } from './AccordionSection'
import { BasicsSection } from './sections/BasicsSection'
import { DescriptionsSection } from './sections/DescriptionsSection'
import { UnlockLogicSection } from './sections/UnlockLogicSection'
import { AppearanceColorsSection } from './sections/AppearanceColorsSection'
import { AppearanceTypographySection } from './sections/AppearanceTypographySection'
import { AppearanceLayoutSection } from './sections/AppearanceLayoutSection'
import { IconSection } from './sections/IconSection'
import { AnimationsSection } from './sections/AnimationsSection'
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {achievement ? 'Edit Achievement' : 'New Achievement'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Organized Form Sections with Accordions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Content & Logic */}
        <AccordionSection
          title="Content & Logic"
          icon={<FileText className="w-4 h-4" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
            <BasicsSection formData={formData} updateField={updateField} />
            <DescriptionsSection formData={formData} updateField={updateField} />
            <UnlockLogicSection
              formData={formData}
              updateField={updateField}
              updateConditionConfig={updateConditionConfig}
            />
          </div>
        </AccordionSection>

        {/* Visual Design */}
        <AccordionSection
          title="Visual Design"
          icon={<Palette className="w-4 h-4" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
            <AppearanceColorsSection
              formData={formData}
              updateAppearance={updateAppearance}
            />
            <AppearanceTypographySection
              formData={formData}
              updateAppearance={updateAppearance}
            />
            <AppearanceLayoutSection
              formData={formData}
              updateAppearance={updateAppearance}
            />
          </div>
        </AccordionSection>

        {/* Assets */}
        <AccordionSection
          title="Assets"
          icon={<Image className="w-4 h-4" />}
        >
          <IconSection formData={formData} updateField={updateField} />
        </AccordionSection>

        {/* Effects */}
        <AccordionSection
          title="Effects & Animation"
          icon={<Zap className="w-4 h-4" />}
        >
          <AnimationsSection
            formData={formData}
            updateAppearance={updateAppearance}
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
  )
}

