'use client'

import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SaveIndicatorProps {
  isSaving: boolean
  hasUnsavedChanges: boolean
  lastSaved: Date | null
  error?: string | null
}

export function SaveIndicator({
  isSaving,
  hasUnsavedChanges,
  lastSaved,
  error,
}: SaveIndicatorProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="w-4 h-4" />
        <span>Save failed</span>
      </div>
    )
  }
  
  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Saving...</span>
      </div>
    )
  }
  
  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
        <AlertCircle className="w-4 h-4" />
        <span>Unsaved changes</span>
      </div>
    )
  }
  
  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <CheckCircle2 className="w-4 h-4" />
        <span>
          Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
        </span>
      </div>
    )
  }
  
  return null
}

