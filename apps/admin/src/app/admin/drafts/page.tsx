/**
 * Drafts List View
 * Shows all saved drafts for recovery
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Clock, Trash2, ExternalLink, AlertCircle } from 'lucide-react'
import { getAllDrafts, clearAllDrafts, type Draft } from '@/hooks/useDraft'
import { formatDistanceToNow } from 'date-fns'
import { Card, DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell, DataTableEmpty, Badge } from '@/components/admin/ui'
import { TableSkeleton } from '@/components/admin/ui/TableSkeleton'

export default function DraftsPage() {
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [filterType, setFilterType] = useState<'all' | 'quiz' | 'achievement'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [sortBy, setSortBy] = useState<string>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Ensure we're on the client side
  useEffect(() => {
    setMounted(true)
  }, [])

  const loadDrafts = useCallback(() => {
    try {
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }
      const allDrafts = getAllDrafts(filterType === 'all' ? undefined : filterType)
      setDrafts(allDrafts)
    } catch (error) {
      console.error('Error loading drafts:', error)
      setDrafts([])
    } finally {
      setIsLoading(false)
    }
  }, [filterType])

  useEffect(() => {
    if (mounted) {
      loadDrafts()
    }
  }, [mounted, loadDrafts])

  // Memoize draft counts for filter buttons
  const draftCounts = useMemo(() => {
    if (typeof window === 'undefined') {
      return { all: 0, quiz: 0, achievement: 0 }
    }
    return {
      all: getAllDrafts().length,
      quiz: getAllDrafts('quiz').length,
      achievement: getAllDrafts('achievement').length,
    }
  }, [drafts, mounted])

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

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const filteredAndSortedDrafts = drafts
    .sort((a, b) => {
      let aVal: any = a[sortBy as keyof typeof a]
      let bVal: any = b[sortBy as keyof typeof b]

      // Handle date strings
      if (sortBy === 'timestamp') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      } else if (sortBy === 'title') {
        aVal = (aVal || '').toLowerCase()
        bVal = (bVal || '').toLowerCase()
      } else if (sortBy === 'type') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

  // Don't render until mounted (prevents hydration issues)
  if (!mounted || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            Drafts
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Recover unsaved work from your drafts
          </p>
        </div>
        <Card className="overflow-hidden p-0">
          <TableSkeleton rows={10} columns={5} />
        </Card>
      </div>
    )
  }

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
        {filteredAndSortedDrafts.length > 0 && (
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
      {mounted && drafts.length > 0 && (
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filterType === 'all'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80'
                }`}
            >
              All ({draftCounts.all})
            </button>
            <button
              onClick={() => setFilterType('quiz')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filterType === 'quiz'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80'
                }`}
            >
              Quizzes ({draftCounts.quiz})
            </button>
            <button
              onClick={() => setFilterType('achievement')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filterType === 'achievement'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80'
                }`}
            >
              Achievements ({draftCounts.achievement})
            </button>
          </div>
        </Card>
      )}

      {/* Table */}
      {isLoading ? (
        <Card className="overflow-hidden p-0">
          <TableSkeleton rows={10} columns={5} />
        </Card>
      ) : (
        <DataTable
          emptyState={{
            icon: <FileText className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />,
            message: filterType === 'all'
              ? 'No drafts found. Drafts will appear here when you start creating content.'
              : `No ${filterType} drafts found`
          }}
        >
          {filteredAndSortedDrafts.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <DataTableHeader>
                    <tr>
                      <DataTableHeaderCell
                        sortable
                        sorted={sortBy === 'type' ? sortOrder : undefined}
                        onSort={() => handleSort('type')}
                      >
                        Type
                      </DataTableHeaderCell>
                      <DataTableHeaderCell
                        sortable
                        sorted={sortBy === 'title' ? sortOrder : undefined}
                        onSort={() => handleSort('title')}
                      >
                        Title
                      </DataTableHeaderCell>
                      <DataTableHeaderCell>Preview</DataTableHeaderCell>
                      <DataTableHeaderCell
                        sortable
                        sorted={sortBy === 'timestamp' ? sortOrder : undefined}
                        onSort={() => handleSort('timestamp')}
                      >
                        Last Modified
                      </DataTableHeaderCell>
                      <DataTableHeaderCell>Actions</DataTableHeaderCell>
                    </tr>
                  </DataTableHeader>
                  <DataTableBody>
                    {filteredAndSortedDrafts.map((draft) => (
                      <DataTableRow key={`${draft.type}_${draft.id}_${draft.timestamp}`}>
                        <DataTableCell>
                          <Badge variant="default" className="text-xs">
                            {getDraftTypeLabel(draft.type)}
                          </Badge>
                        </DataTableCell>
                        <DataTableCell>
                          <div className="text-xs">
                            <p className="font-medium text-[hsl(var(--foreground))]">
                              {draft.title || `Untitled ${getDraftTypeLabel(draft.type)}`}
                            </p>
                            {draft.id !== 'new' && (
                              <p className="text-[hsl(var(--muted-foreground))] mt-0.5">
                                ID: {draft.id}
                              </p>
                            )}
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          {draft.preview ? (
                            <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 max-w-md">
                              {draft.preview}
                            </p>
                          ) : (
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>
                          )}
                        </DataTableCell>
                        <DataTableCell>
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatDistanceToNow(new Date(draft.timestamp), { addSuffix: true })}</span>
                            </div>
                            <div className="mt-1">{getDraftSize(draft)}</div>
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRestore(draft)}
                              className="px-4 py-2 text-sm font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 rounded-lg transition-colors flex items-center gap-1.5"
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
                        </DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </table>
              </div>
            </>
          )}
        </DataTable>
      )}

      {/* Info Box */}
      {filteredAndSortedDrafts.length > 0 && (
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

