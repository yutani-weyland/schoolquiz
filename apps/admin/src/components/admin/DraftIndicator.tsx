/**
 * Draft Indicator Badge
 * Shows when drafts exist for the current context
 */

'use client'

import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import * as Tooltip from '@radix-ui/react-tooltip'
import { getAllDrafts, type Draft } from '@/hooks/useDraft'

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

  const tooltipText = `${draftCount} unfinished draft${draftCount > 1 ? 's' : ''}`

  const content = (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-xs font-medium">
      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
      {showCount && draftCount > 0 && (
        <span className="text-xs font-semibold leading-none">
          {draftCount > 99 ? '99+' : draftCount}
        </span>
      )}
    </div>
  )

  const wrappedContent = linkToDrafts ? (
    <Link
      href="/admin/drafts"
      className="inline-flex items-center hover:opacity-80 transition-opacity"
    >
      {content}
    </Link>
  ) : (
    content
  )

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {wrappedContent}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-[hsl(var(--raised))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] text-xs px-2 py-1 rounded shadow-lg z-50"
            side="bottom"
            sideOffset={4}
          >
            {tooltipText}
            <Tooltip.Arrow className="fill-[hsl(var(--raised))]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

