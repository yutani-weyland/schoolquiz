'use client'

import { createContext, useContext, ReactNode, useEffect, useState } from 'react'

interface AchievementFormContextType {
  formData: any
  setFormData: (data: any) => void
  updateField?: (field: string | keyof any, value: any) => void
  updateAppearance?: (field: string, value: any) => void
  onSave?: () => void
  isSaving?: boolean
}

const AchievementFormContext = createContext<AchievementFormContextType | null>(null)

export function AchievementFormProvider({
  children,
  formData: initialFormData,
  updateField,
  updateAppearance,
  onSave,
  isSaving,
}: {
  children: ReactNode
  formData: any
  updateField?: (field: string | keyof any, value: any) => void
  updateAppearance?: (field: string, value: any) => void
  onSave?: () => void
  isSaving?: boolean
}) {
  const [formData, setFormData] = useState(initialFormData)
  
  // Sync with prop changes
  useEffect(() => {
    setFormData(initialFormData)
  }, [initialFormData])
  
  return (
    <AchievementFormContext.Provider value={{ 
      formData, 
      setFormData,
      updateField,
      updateAppearance,
      onSave,
      isSaving,
    }}>
      {children}
    </AchievementFormContext.Provider>
  )
}

export function useAchievementFormContext() {
  const context = useContext(AchievementFormContext)
  if (!context) {
    throw new Error('useAchievementFormContext must be used within AchievementFormProvider')
  }
  return context
}

