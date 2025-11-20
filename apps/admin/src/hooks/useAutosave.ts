'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseAutosaveOptions {
  /** The data to save */
  data: any
  /** Function to call to save the data */
  onSave: (data: any) => Promise<void>
  /** Delay in milliseconds before saving after last change (default: 10000) */
  delay?: number
  /** Enable autosave (default: true) */
  enabled?: boolean
  /** Callback when save starts */
  onSaveStart?: () => void
  /** Callback when save completes */
  onSaveComplete?: () => void
  /** Callback when save fails */
  onSaveError?: (error: Error) => void
}

interface UseAutosaveReturn {
  /** Whether a save is in progress */
  isSaving: boolean
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean
  /** Last saved timestamp */
  lastSaved: Date | null
  /** Save manually */
  save: () => Promise<void>
  /** Clear unsaved changes flag */
  clearUnsavedChanges: () => void
}

/**
 * Hook for autosaving data with debouncing
 */
export function useAutosave({
  data,
  onSave,
  delay = 10000, // 10 seconds
  enabled = true,
  onSaveStart,
  onSaveComplete,
  onSaveError,
}: UseAutosaveOptions): UseAutosaveReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = useRef<string | null>(null)
  const isInitialMountRef = useRef(true)
  
  // Serialize data for comparison
  const serializeData = useCallback((data: any) => {
    try {
      return JSON.stringify(data)
    } catch {
      return null
    }
  }, [])
  
  // Save function
  const save = useCallback(async () => {
    if (isSaving) return
    
    setIsSaving(true)
    onSaveStart?.()
    
    try {
      await onSave(data)
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      lastSavedDataRef.current = serializeData(data)
      onSaveComplete?.()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Save failed')
      onSaveError?.(err)
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [data, onSave, isSaving, onSaveStart, onSaveComplete, onSaveError, serializeData])
  
  // Effect to handle autosave
  useEffect(() => {
    if (!enabled) return
    if (isInitialMountRef.current) {
      // Mark initial data as "saved" on mount
      lastSavedDataRef.current = serializeData(data)
      isInitialMountRef.current = false
      return
    }
    
    // Check if data has actually changed
    const currentDataStr = serializeData(data)
    if (currentDataStr === lastSavedDataRef.current) {
      return
    }
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true)
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Set new timeout to save
    timeoutRef.current = setTimeout(() => {
      save().catch((error) => {
        console.error('Autosave failed:', error)
      })
    }, delay)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, delay, enabled, save, serializeData])
  
  // Clear unsaved changes flag
  const clearUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(false)
    lastSavedDataRef.current = serializeData(data)
  }, [data, serializeData])
  
  return {
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    save,
    clearUnsavedChanges,
  }
}

