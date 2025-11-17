'use client'

import { createContext, useContext, ReactNode, useEffect, useState } from 'react'

interface AchievementFormContextType {
  formData: any
  setFormData: (data: any) => void
}

const AchievementFormContext = createContext<AchievementFormContextType | null>(null)

export function AchievementFormProvider({
  children,
  formData: initialFormData,
}: {
  children: ReactNode
  formData: any
}) {
  const [formData, setFormData] = useState(initialFormData)
  
  // Sync with prop changes
  useEffect(() => {
    setFormData(initialFormData)
  }, [initialFormData])
  
  return (
    <AchievementFormContext.Provider value={{ formData, setFormData }}>
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

