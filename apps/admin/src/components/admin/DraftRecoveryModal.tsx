/**
 * Draft Recovery Modal
 * Shows when a draft exists for recovery after page load
 */

'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Clock, FileText, X } from 'lucide-react'
import { Draft } from '@/hooks/useDraft'
import { formatDistanceToNow } from 'date-fns'

interface DraftRecoveryModalProps {
  /** Draft to recover */
  draft: Draft
  /** Callback when user chooses to restore draft */
  onRestore: () => void
  /** Callback when user chooses to discard draft */
  onDiscard: () => void
  /** Whether modal is open */
  open: boolean
  /** Close handler */
  onClose: () => void
}

export function DraftRecoveryModal({
  draft,
  onRestore,
  onDiscard,
  open,
  onClose,
}: DraftRecoveryModalProps) {
  const [isVisible, setIsVisible] = useState(open)

  useEffect(() => {
    setIsVisible(open)
  }, [open])

  if (!isVisible) return null

  const timeAgo = formatDistanceToNow(new Date(draft.timestamp), { addSuffix: true })
  const draftSize = new Blob([JSON.stringify(draft.data)]).size
  const sizeKB = (draftSize / 1024).toFixed(1)

  const handleRestore = () => {
    onRestore()
    setIsVisible(false)
    onClose()
  }

  const handleDiscard = () => {
    onDiscard()
    setIsVisible(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-2xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                Draft Found
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Unsaved work detected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-[hsl(var(--foreground))]">
              We found an unsaved draft. Would you like to restore it?
            </p>

            {/* Draft Info */}
            <div className="bg-[hsl(var(--muted))] rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-[hsl(var(--muted-foreground))] mt-0.5" />
                <div className="flex-1 min-w-0">
                  {draft.title ? (
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                      {draft.title}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                      {draft.type === 'quiz' ? 'Untitled Quiz' : 'Untitled Achievement'}
                    </p>
                  )}
                  {draft.preview && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">
                      {draft.preview}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Saved {timeAgo}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{sizeKB} KB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleRestore}
              className="flex-1 px-4 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg font-medium hover:bg-[hsl(var(--primary))]/90 transition-colors"
            >
              Restore Draft
            </button>
            <button
              onClick={handleDiscard}
              className="flex-1 px-4 py-2.5 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-lg font-medium hover:bg-[hsl(var(--muted))]/80 transition-colors"
            >
              Discard
            </button>
          </div>

          <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">
            You can always restore this draft later from your drafts list
          </p>
        </div>
      </div>
    </div>
  )
}

