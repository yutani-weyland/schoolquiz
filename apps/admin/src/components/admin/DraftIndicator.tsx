/**
 * Draft Indicator Badge
 * Shows when drafts exist for the current context
 */

'use client'

import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { checkDraft, getAllDrafts, type Draft } from '@/hooks/useDraft'

interface DraftIndicatorProps {
  /** Type of draft to check */
  type?: 'quiz' | 'achievement' | 'all'
  /** Entity ID (if checking for specific entity) */
  id?: string | null
  /** Show count badge instead of just icon */
  showCount?: boolean
  /** Link to drafts page */
  linkToDrafts?: boolean
}

export function DraftIndicator({
  type = 'all',
  id,
  showCount = false,
  linkToDrafts = true,
}: DraftIndicatorProps) {
  const [draftCount, setDraftCount] = useState(0)
  const [hasCurrentDraft, setHasCurrentDraft] = useState(false)

  useEffect(() => {
    const updateDraftStatus = () => {
      if (id && type !== 'all') {
        // Check for specific draft
        const storageKey = `sq_draft_${type}_${id === 'new' ? 'new' : id}`
        const hasDraft = !!localStorage.getItem(storageKey)
        setHasCurrentDraft(hasDraft)
        setDraftCount(hasDraft ? 1 : 0)
      } else {
        // Get all drafts count
        const drafts = getAllDrafts(type === 'all' ? undefined : type)
        setDraftCount(drafts.length)
        setHasCurrentDraft(drafts.length > 0)
      }
    }

    updateDraftStatus()

    // Listen for storage changes (when drafts are saved/cleared)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('sq_draft_')) {
        updateDraftStatus()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also check periodically (for same-tab changes)
    const interval = setInterval(updateDraftStatus, 2000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [type, id])

  if (!hasCurrentDraft) return null

  const content = (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-medium">
      <FileText className="w-3.5 h-3.5" />
      {showCount && draftCount > 0 && (
        <span className="min-w-[1.25rem] text-center">{draftCount}</span>
      )}
      <span className="hidden sm:inline">
        {showCount && draftCount > 1 ? 'Drafts' : 'Draft'}
      </span>
    </div>
  )

  if (linkToDrafts) {
    return (
      <Link
        href="/admin/drafts"
        className="inline-flex items-center hover:opacity-80 transition-opacity"
        title={`${draftCount} draft${draftCount > 1 ? 's' : ''} available`}
      >
        {content}
      </Link>
    )
  }

  return (
    <div title={`${draftCount} draft${draftCount > 1 ? 's' : ''} available`}>
      {content}
    </div>
  )
}

