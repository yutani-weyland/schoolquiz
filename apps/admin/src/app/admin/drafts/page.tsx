/**
 * Drafts List View
 * Shows all saved drafts for recovery
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Clock, Trash2, ExternalLink, AlertCircle } from 'lucide-react'
import { getAllDrafts, clearAllDrafts, type Draft } from '@/hooks/useDraft'
import { formatDistanceToNow } from 'date-fns'

export default function DraftsPage() {
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [filterType, setFilterType] = useState<'all' | 'quiz' | 'achievement'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDrafts()
  }, [filterType])

  const loadDrafts = () => {
    try {
      const allDrafts = getAllDrafts(filterType === 'all' ? undefined : filterType)
      setDrafts(allDrafts)
    } catch (error) {
      console.error('Error loading drafts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = (draft: Draft) => {
    if (draft.type === 'quiz') {
      router.push(`/admin/quizzes/builder`)
      // Store draft to be loaded by the builder
      sessionStorage.setItem('restore_draft', JSON.stringify(draft))
    } else if (draft.type === 'achievement') {
      router.push(`/admin/achievements`)
      // Store draft to be loaded by the achievement editor
      sessionStorage.setItem('restore_draft', JSON.stringify(draft))
    }
  }

  const handleDelete = (draft: Draft) => {
    if (!confirm(`Delete this draft? This action cannot be undone.`)) return

    try {
      const storageKey = `sq_draft_${draft.type}_${draft.id === 'new' ? 'new' : draft.id}`
      localStorage.removeItem(storageKey)
      loadDrafts()
    } catch (error) {
      console.error('Error deleting draft:', error)
      alert('Failed to delete draft')
    }
  }

  const handleDeleteAll = () => {
    const count = drafts.length
    if (!confirm(`Delete all ${count} draft${count > 1 ? 's' : ''}? This action cannot be undone.`)) return

    try {
      clearAllDrafts(filterType === 'all' ? undefined : filterType)
      loadDrafts()
    } catch (error) {
      console.error('Error clearing drafts:', error)
      alert('Failed to clear drafts')
    }
  }

  const getDraftTypeLabel = (type: string) => {
    return type === 'quiz' ? 'Quiz' : 'Achievement'
  }

  const getDraftIcon = (type: string) => {
    return <FileText className="w-4 h-4" />
  }

  const getDraftSize = (draft: Draft) => {
    const size = new Blob([JSON.stringify(draft.data)]).size
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / 1024 / 1024).toFixed(2)} MB`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
      </div>
    )
  }

  const filteredDrafts = drafts

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            Drafts
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Recover unsaved work from your drafts
          </p>
        </div>
        {filteredDrafts.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Filters */}
      {drafts.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80'
            }`}
          >
            All ({getAllDrafts().length})
          </button>
          <button
            onClick={() => setFilterType('quiz')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filterType === 'quiz'
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80'
            }`}
          >
            Quizzes ({getAllDrafts('quiz').length})
          </button>
          <button
            onClick={() => setFilterType('achievement')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filterType === 'achievement'
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80'
            }`}
          >
            Achievements ({getAllDrafts('achievement').length})
          </button>
        </div>
      )}

      {/* Drafts List */}
      {filteredDrafts.length === 0 ? (
        <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
          <p className="mt-4 text-sm font-medium text-[hsl(var(--foreground))]">
            No drafts found
          </p>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            {filterType === 'all'
              ? 'Drafts will appear here when you start creating content'
              : `No ${filterType} drafts found`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDrafts.map((draft) => (
            <div
              key={`${draft.type}_${draft.id}_${draft.timestamp}`}
              className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 hover:border-[hsl(var(--primary))] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {getDraftIcon(draft.type)}
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                      {getDraftTypeLabel(draft.type)}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {draft.id === 'new' ? 'New' : `ID: ${draft.id}`}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-1">
                    {draft.title || `Untitled ${getDraftTypeLabel(draft.type)}`}
                  </h3>

                  {draft.preview && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-3">
                      {draft.preview}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Saved {formatDistanceToNow(new Date(draft.timestamp), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{getDraftSize(draft)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRestore(draft)}
                    className="px-3 py-1.5 text-sm font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Restore
                  </button>
                  <button
                    onClick={() => handleDelete(draft)}
                    className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      {filteredDrafts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1 text-sm text-amber-800 dark:text-amber-300">
            <p className="font-medium mb-1">About Drafts</p>
            <p>
              Drafts are automatically saved as you work. They're stored locally in your browser and will be
              cleared after 7 days or when you successfully save your work. Drafts are only accessible on this device.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

