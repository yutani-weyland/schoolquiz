/**
 * Hook for managing drafts in localStorage
 * Complements autosave by persisting drafts locally for recovery
 */

import { useState, useEffect, useCallback } from 'react'

export interface Draft<T = any> {
  id: string // Entity ID (e.g., quiz ID, achievement ID)
  type: 'quiz' | 'achievement' // Draft type
  data: T // Draft data
  timestamp: number // When draft was saved
  title?: string // Human-readable title for preview
  preview?: string // Preview text/summary
}

const STORAGE_PREFIX = 'sq_draft_'

export interface UseDraftOptions<T> {
  /** Draft type */
  type: 'quiz' | 'achievement'
  /** Entity ID (if editing existing) */
  id?: string | null
  /** Current data to save as draft */
  data: T
  /** Function to generate draft title */
  getTitle?: (data: T) => string
  /** Function to generate draft preview */
  getPreview?: (data: T) => string
  /** Auto-save draft interval in milliseconds (default: 30 seconds) */
  autoSaveInterval?: number
  /** Whether to auto-save drafts (default: true) */
  enabled?: boolean
}

export interface UseDraftReturn<T> {
  /** Whether a draft exists */
  hasDraft: boolean
  /** Current draft (if exists) */
  draft: Draft<T> | null
  /** Save draft manually */
  saveDraft: () => void
  /** Load draft */
  loadDraft: () => Draft<T> | null
  /** Clear draft */
  clearDraft: () => void
  /** Check if draft exists */
  checkDraft: () => boolean
}

/**
 * Get storage key for draft
 */
function getStorageKey(type: string, id: string | null | undefined): string {
  const key = id ? `${type}_${id}` : `${type}_new`
  return `${STORAGE_PREFIX}${key}`
}

/**
 * Hook for managing drafts
 */
export function useDraft<T>({
  type,
  id,
  data,
  getTitle,
  getPreview,
  autoSaveInterval = 30000, // 30 seconds
  enabled = true,
}: UseDraftOptions<T>): UseDraftReturn<T> {
  const [hasDraft, setHasDraft] = useState(false)
  const [draft, setDraft] = useState<Draft<T> | null>(null)

  const storageKey = getStorageKey(type, id)

  // Check if draft exists
  const checkDraft = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) {
        setHasDraft(false)
        setDraft(null)
        return false
      }

      const parsed: Draft<T> = JSON.parse(stored)
      setHasDraft(true)
      setDraft(parsed)
      return true
    } catch (error) {
      console.error('Error checking draft:', error)
      setHasDraft(false)
      setDraft(null)
      return false
    }
  }, [storageKey])

  // Load draft
  const loadDraft = useCallback((): Draft<T> | null => {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return null

      const parsed: Draft<T> = JSON.parse(stored)
      setHasDraft(false) // Mark as loaded (will be cleared after use)
      setDraft(null)
      return parsed
    } catch (error) {
      console.error('Error loading draft:', error)
      return null
    }
  }, [storageKey])

  // Save draft
  const saveDraft = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return

    try {
      // Check if data has meaningful content (don't save empty drafts)
      const dataStr = JSON.stringify(data)
      if (dataStr === '{}' || dataStr === '[]' || dataStr === 'null') {
        return
      }

      const draft: Draft<T> = {
        id: id || 'new',
        type,
        data,
        timestamp: Date.now(),
        title: getTitle?.(data),
        preview: getPreview?.(data),
      }

      localStorage.setItem(storageKey, JSON.stringify(draft))
      setHasDraft(true)
      setDraft(draft)
    } catch (error) {
      console.error('Error saving draft:', error)
      // Handle quota exceeded errors gracefully
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded, clearing old drafts')
        // Could implement cleanup of old drafts here
      }
    }
  }, [type, id, data, getTitle, getPreview, storageKey, enabled])

  // Clear draft
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(storageKey)
      setHasDraft(false)
      setDraft(null)
    } catch (error) {
      console.error('Error clearing draft:', error)
    }
  }, [storageKey])

  // Check for draft on mount
  useEffect(() => {
    checkDraft()
  }, [checkDraft])

  // Auto-save draft periodically
  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      saveDraft()
    }, autoSaveInterval)

    return () => clearInterval(interval)
  }, [enabled, autoSaveInterval, saveDraft])

  // Save draft when data changes (debounced)
  useEffect(() => {
    if (!enabled) return

    const timeout = setTimeout(() => {
      saveDraft()
    }, 5000) // Debounce: save 5 seconds after last change

    return () => clearTimeout(timeout)
  }, [data, enabled, saveDraft])

  return {
    hasDraft,
    draft,
    saveDraft,
    loadDraft,
    clearDraft,
    checkDraft,
  }
}

/**
 * Get all drafts for a type
 */
export function getAllDrafts(type?: 'quiz' | 'achievement'): Draft[] {
  if (typeof window === 'undefined') return []

  const drafts: Draft[] = []

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue

      const stored = localStorage.getItem(key)
      if (!stored) continue

      try {
        const draft: Draft = JSON.parse(stored)
        if (!type || draft.type === type) {
          drafts.push(draft)
        }
      } catch (error) {
        // Skip invalid entries
        continue
      }
    }
  } catch (error) {
    console.error('Error getting drafts:', error)
  }

  return drafts.sort((a, b) => b.timestamp - a.timestamp) // Newest first
}

/**
 * Clear all drafts for a type
 */
export function clearAllDrafts(type?: 'quiz' | 'achievement'): void {
  if (typeof window === 'undefined') return

  try {
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue

      if (!type) {
        keysToRemove.push(key)
        continue
      }

      try {
        const stored = localStorage.getItem(key)
        if (!stored) continue

        const draft: Draft = JSON.parse(stored)
        if (draft.type === type) {
          keysToRemove.push(key)
        }
      } catch (error) {
        // Skip invalid entries
        continue
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
  } catch (error) {
    console.error('Error clearing drafts:', error)
  }
}

