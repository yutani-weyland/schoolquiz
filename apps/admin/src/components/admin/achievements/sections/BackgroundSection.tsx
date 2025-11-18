'use client'

import { FileUpload } from '../FileUpload'

interface BackgroundSectionProps {
  formData: any
  updateAppearance: (field: string, value: any) => void
}

export function BackgroundSection({
  formData,
  updateAppearance,
}: BackgroundSectionProps) {
  const appearance = formData.appearance || {}

  return (
    <div className="space-y-3">
      <FileUpload
        label="Card Background (PNG)"
        value={appearance.backgroundImage || ''}
        onChange={(url) => updateAppearance('backgroundImage', url)}
        type="background"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Background applies to both front and back of the card
      </p>
    </div>
  )
}

