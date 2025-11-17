'use client'

import { useState, useEffect } from 'react'

interface AchievementFormData {
  slug: string
  name: string
  shortDescription: string
  longDescription: string
  category: string
  rarity: string
  isPremiumOnly: boolean
  seasonTag: string
  iconKey: string
  unlockConditionType: string
  unlockConditionConfig: Record<string, any>
  appearance: Record<string, any>
  isActive: boolean
  points: number | null
  series: string
  cardVariant: string
}

const defaultAppearance = {
  variant: 'compact' as const,
  backgroundColor: '#F59E0B',
  backgroundGradientFrom: undefined,
  backgroundGradientTo: undefined,
  patternOpacity: 0,
  borderColor: undefined,
  borderWidth: 0,
  textColorPrimary: '#FFFFFF',
  textColorSecondary: '#FFFFFF',
  accentColor: undefined,
  titleFontFamily: 'system-ui',
  bodyFontFamily: 'system-ui',
  titleLetterSpacing: 0,
  titleCase: 'normal' as const,
  iconType: 'library' as const,
  iconUrl: undefined,
  iconKey: undefined,
  iconShadow: false,
  iconScale: 1,
  cornerRadius: 12,
  elevation: 2,
  padding: 16,
  rotationDegrees: 0,
  animationPreset: 'none' as const,
  animationOnUnlock: false,
  animationOnHover: false,
}

export function useAchievementForm(
  existingAchievement?: {
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
) {
  const [formData, setFormData] = useState<AchievementFormData>({
    slug: '',
    name: '',
    shortDescription: '',
    longDescription: '',
    category: 'performance',
    rarity: 'common',
    isPremiumOnly: false,
    seasonTag: '',
    iconKey: '',
    unlockConditionType: 'score_perfect_in_category_under_seconds',
    unlockConditionConfig: {},
    appearance: defaultAppearance,
    isActive: true,
    points: null,
    series: '',
    cardVariant: 'standard',
  })

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (existingAchievement) {
      setFormData({
        slug: existingAchievement.slug,
        name: existingAchievement.name,
        shortDescription: existingAchievement.shortDescription,
        longDescription: existingAchievement.longDescription || '',
        category: existingAchievement.category,
        rarity: existingAchievement.rarity,
        isPremiumOnly: existingAchievement.isPremiumOnly,
        seasonTag: existingAchievement.seasonTag || '',
        iconKey: existingAchievement.iconKey || '',
        unlockConditionType: existingAchievement.unlockConditionType,
        unlockConditionConfig: existingAchievement.unlockConditionConfig
          ? (() => {
              try {
                return typeof existingAchievement.unlockConditionConfig === 'string'
                  ? JSON.parse(existingAchievement.unlockConditionConfig)
                  : existingAchievement.unlockConditionConfig
              } catch (error) {
                console.error('Error parsing unlockConditionConfig:', error)
                return {}
              }
            })()
          : {},
        appearance: existingAchievement.appearance
          ? (() => {
              try {
                return typeof existingAchievement.appearance === 'string'
                  ? JSON.parse(existingAchievement.appearance)
                  : existingAchievement.appearance
              } catch (error) {
                console.error('Error parsing appearance:', error)
                return defaultAppearance
              }
            })()
          : defaultAppearance,
        isActive: existingAchievement.isActive,
        points: existingAchievement.points || null,
        series: existingAchievement.series || '',
        cardVariant: existingAchievement.cardVariant || 'standard',
      })
    }
  }, [existingAchievement])

  const updateField = (field: keyof AchievementFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateAppearance = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, [field]: value },
    }))
  }

  const updateConditionConfig = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      unlockConditionConfig: { ...prev.unlockConditionConfig, [field]: value },
    }))
  }

  const saveAchievement = async (): Promise<boolean> => {
    try {
      setIsSaving(true)

      const payload = {
        ...formData,
        seasonTag: formData.seasonTag || null,
        iconKey: formData.iconKey || null,
        points: formData.points || null,
        series: formData.series || null,
        cardVariant: formData.cardVariant || null,
        longDescription: formData.longDescription || null,
      }

      const url = existingAchievement
        ? `/api/admin/achievements/${existingAchievement.id}`
        : '/api/admin/achievements'
      const method = existingAchievement ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Failed to save: ${error.error || 'Unknown error'}`)
        return false
      }

      return true
    } catch (error: any) {
      console.error('Error saving achievement:', error)
      alert(`Failed to save: ${error.message}`)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return {
    formData,
    updateField,
    updateAppearance,
    updateConditionConfig,
    isSaving,
    saveAchievement,
  }
}

