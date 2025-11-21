'use client'

/**
 * Client component for the quizzes table
 * Handles sorting, search input, filters, and actions
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Search, Filter, CheckCircle2, FileText, Trash2, Archive, Upload, Loader2, Edit2, Copy, X, Download } from 'lucide-react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader, Card, Input, Select, Button, Badge, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell } from '@/components/admin/ui'

interface Quiz {
  id: string
  title: string
  blurb?: string | null
  audience?: string | null
  difficultyBand?: string | null
  theme?: string | null
  seasonalTag?: string | null
  publicationDate?: string | null
  status: string
  pdfUrl?: string | null
  pdfStatus?: string | null
  createdAt: string
  updatedAt: string
  _count: {
    rounds: number
    runs: number
  }
}

interface QuizzesTableProps {
  initialQuizzes: Quiz[]
  initialPagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  initialSearch?: string
  initialStatus?: string
}

export function QuizzesTable({ 
  initialQuizzes, 
  initialPagination,
  initialSearch = '',
  initialStatus = ''
}: QuizzesTableProps) {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes)
  const [pagination] = useState(initialPagination)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedQuizIds, setSelectedQuizIds] = useState<Set<string>>(new Set())
  const [isBulkOperating, setIsBulkOperating] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null) // Track which quiz is generating PDF
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Client-side sorting
  const sortedQuizzes = useMemo(() => {
    return [...quizzes].sort((a, b) => {
      let aVal: any
      let bVal: any
      
      switch (sortBy) {
        case 'title':
          aVal = a.title.toLowerCase()
          bVal = b.title.toLowerCase()
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        case 'runs':
          aVal = a._count?.runs ?? 0
          bVal = b._count?.runs ?? 0
          break
        case 'publicationDate':
          aVal = a.publicationDate ? new Date(a.publicationDate).getTime() : 0
          bVal = b.publicationDate ? new Date(b.publicationDate).getTime() : 0
          break
        case 'createdAt':
        default:
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
          break
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [quizzes, sortBy, sortOrder])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Debounce search - update URL after 500ms of no typing
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (value) params.set('search', value)
      if (statusFilter) params.set('status', statusFilter)
      router.push(`/admin/quizzes?${params.toString()}`)
    }, 500)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (value) params.set('status', value)
    router.push(`/admin/quizzes?${params.toString()}`)
  }

  const handleDelete = async (quizId: string, quizTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${quizTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (response.ok) {
        // Refresh the page to get updated data
        router.refresh()
      } else {
        alert(data.error || 'Failed to delete quiz')
      }
    } catch (error) {
      console.error('Failed to delete quiz:', error)
      alert('Failed to delete quiz')
    }
  }

  const handleDuplicate = async (quizId: string) => {
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/duplicate`, {
        method: 'POST',
      })

      const data = await response.json()
      if (response.ok) {
        // Refresh the page to get updated data
        router.refresh()
        alert(`Quiz duplicated successfully! New quiz: "${data.quiz.title}"`)
      } else {
        alert(data.error || 'Failed to duplicate quiz')
      }
    } catch (error) {
      console.error('Failed to duplicate quiz:', error)
      alert('Failed to duplicate quiz')
    }
  }

  // Selection handlers
  const toggleSelectQuiz = (quizId: string) => {
    setSelectedQuizIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(quizId)) {
        newSet.delete(quizId)
      } else {
        newSet.add(quizId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedQuizIds.size === sortedQuizzes.length) {
      setSelectedQuizIds(new Set())
    } else {
      setSelectedQuizIds(new Set(sortedQuizzes.map(q => q.id)))
    }
  }

  const isAllSelected = sortedQuizzes.length > 0 && selectedQuizIds.size === sortedQuizzes.length
  const isIndeterminate = selectedQuizIds.size > 0 && selectedQuizIds.size < sortedQuizzes.length

  // Bulk operations
  const handleBulkPublish = async () => {
    const ids = Array.from(selectedQuizIds)
    if (ids.length === 0) return

    if (!confirm(`Publish ${ids.length} quiz${ids.length > 1 ? 'zes' : ''}?`)) return

    setIsBulkOperating(true)
    try {
      const response = await fetch('/api/admin/quizzes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish', ids }),
      })

      const data = await response.json()
      if (response.ok) {
        setSelectedQuizIds(new Set())
        router.refresh()
        alert(`Successfully published ${data.succeeded || ids.length} quiz${ids.length > 1 ? 'zes' : ''}`)
      } else {
        alert(data.error || 'Failed to publish quizzes')
      }
    } catch (error) {
      console.error('Failed to publish quizzes:', error)
      alert('Failed to publish quizzes')
    } finally {
      setIsBulkOperating(false)
    }
  }

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedQuizIds)
    if (ids.length === 0) return

    if (!confirm(`Archive ${ids.length} quiz${ids.length > 1 ? 'zes' : ''}?`)) return

    setIsBulkOperating(true)
    try {
      const response = await fetch('/api/admin/quizzes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', ids }),
      })

      const data = await response.json()
      if (response.ok) {
        setSelectedQuizIds(new Set())
        router.refresh()
        alert(`Successfully archived ${data.succeeded || ids.length} quiz${ids.length > 1 ? 'zes' : ''}`)
      } else {
        alert(data.error || 'Failed to archive quizzes')
      }
    } catch (error) {
      console.error('Failed to archive quizzes:', error)
      alert('Failed to archive quizzes')
    } finally {
      setIsBulkOperating(false)
    }
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedQuizIds)
    if (ids.length === 0) return

    if (!confirm(`Delete ${ids.length} quiz${ids.length > 1 ? 'zes' : ''}? This action cannot be undone.`)) return

    setIsBulkOperating(true)
    try {
      const response = await fetch('/api/admin/quizzes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids }),
      })

      const data = await response.json()
      if (response.ok) {
        setSelectedQuizIds(new Set())
        router.refresh()
        alert(`Successfully deleted ${data.succeeded || ids.length} quiz${ids.length > 1 ? 'zes' : ''}`)
      } else {
        alert(data.error || 'Failed to delete quizzes')
      }
    } catch (error) {
      console.error('Failed to delete quizzes:', error)
      alert('Failed to delete quizzes')
    } finally {
      setIsBulkOperating(false)
    }
  }

  const handleGeneratePDF = async (quizId: string) => {
    setIsGeneratingPDF(quizId)
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/pdf`, {
        method: 'POST',
      })

      const data = await response.json()
      if (response.ok) {
        router.refresh()
        if (data.pdfUrl) {
          window.open(data.pdfUrl, '_blank')
        }
        alert('PDF generated successfully!')
      } else {
        alert(data.error || 'Failed to generate PDF')
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF')
    } finally {
      setIsGeneratingPDF(null)
    }
  }

  const handleBulkGeneratePDF = async () => {
    const ids = Array.from(selectedQuizIds)
    if (ids.length === 0) return

    if (!confirm(`Generate PDFs for ${ids.length} quiz${ids.length > 1 ? 'zes' : ''}? This may take a while.`)) return

    setIsBulkOperating(true)
    let successCount = 0
    let failCount = 0

    try {
      // Generate PDFs sequentially to avoid overwhelming the server
      for (const id of ids) {
        try {
          const response = await fetch(`/api/admin/quizzes/${id}/pdf`, {
            method: 'POST',
          })
          const data = await response.json()
          if (response.ok) {
            successCount++
          } else {
            failCount++
            console.error(`Failed to generate PDF for quiz ${id}:`, data.error)
          }
        } catch (error) {
          failCount++
          console.error(`Failed to generate PDF for quiz ${id}:`, error)
        }
      }

      setSelectedQuizIds(new Set())
      router.refresh()
      alert(`PDF generation complete: ${successCount} succeeded, ${failCount} failed`)
    } catch (error) {
      console.error('Failed to generate PDFs:', error)
      alert('Failed to generate PDFs')
    } finally {
      setIsBulkOperating(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      // Cmd+A or Ctrl+A to select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        if (selectedQuizIds.size === sortedQuizzes.length) {
          setSelectedQuizIds(new Set())
        } else {
          setSelectedQuizIds(new Set(sortedQuizzes.map(q => q.id)))
        }
      }
      // Escape to deselect all
      if (e.key === 'Escape') {
        setSelectedQuizIds(new Set())
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sortedQuizzes, selectedQuizIds.size])


  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, 'default' | 'info' | 'success'> = {
      draft: 'default',
      scheduled: 'info',
      published: 'success',
    }
    return statusMap[status] || 'default'
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Calculate quiz IDs for published quizzes
  const publishedQuizzes = sortedQuizzes
    .filter(q => q.status === 'published')
    .sort((a, b) => {
      const dateA = a.publicationDate ? new Date(a.publicationDate).getTime() : 0
      const dateB = b.publicationDate ? new Date(b.publicationDate).getTime() : 0
      return dateA - dateB
    })
  
  const quizIdMap = new Map<string, number>()
  publishedQuizzes.forEach((q, idx) => {
    quizIdMap.set(q.id, idx + 1)
  })

  return (
    <div className={`space-y-6 ${selectedQuizIds.size > 0 ? 'pr-80' : ''} transition-all duration-300`}>
      <PageHeader
        title="Quizzes"
        description="Manage quizzes, view analytics, and schedule publications"
        action={
          <Link href="/admin/quizzes/builder">
            <Button>
              <Plus className="w-4 h-4" />
              Create Quiz
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
            <Input
              type="text"
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Clear timeout and search immediately
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current)
                  }
                  const params = new URLSearchParams()
                  if (searchQuery) params.set('search', searchQuery)
                  if (statusFilter) params.set('status', statusFilter)
                  router.push(`/admin/quizzes?${params.toString()}`)
                }
              }}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
            <Select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="pl-10"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Slide-out Bulk Actions Panel */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedQuizIds.size > 0 && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-[60] w-80 bg-[hsl(var(--card))] border-l border-[hsl(var(--border))] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] h-[60px]">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-pulse flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] whitespace-nowrap">
                    Bulk Actions
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedQuizIds(new Set())}
                  className="p-2 rounded-xl hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-all duration-200 flex-shrink-0"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Selection count */}
              <div className="px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
                <div className="px-3 py-1.5 bg-[hsl(var(--primary))]/10 rounded-lg border border-[hsl(var(--primary))]/20 inline-block">
                  <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                    {selectedQuizIds.size} {selectedQuizIds.size === 1 ? 'quiz' : 'quizzes'} selected
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-3 uppercase tracking-wide">
                    Status Actions
                  </label>
                  <div className="space-y-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleBulkPublish}
                      disabled={isBulkOperating}
                      className="w-full justify-start gap-2 text-xs h-9 hover:bg-[hsl(var(--muted))]"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Publish {selectedQuizIds.size} {selectedQuizIds.size === 1 ? 'quiz' : 'quizzes'}</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleBulkArchive}
                      disabled={isBulkOperating}
                      className="w-full justify-start gap-2 text-xs h-9 hover:bg-[hsl(var(--muted))]"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Archive {selectedQuizIds.size} {selectedQuizIds.size === 1 ? 'quiz' : 'quizzes'}</span>
                    </Button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[hsl(var(--border))]">
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-3 uppercase tracking-wide">
                    PDF Generation
                  </label>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleBulkGeneratePDF}
                    disabled={isBulkOperating}
                    className="w-full justify-start gap-2 text-xs h-9 hover:bg-[hsl(var(--muted))]"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Generate PDFs ({selectedQuizIds.size})</span>
                  </Button>
                </div>

                <div className="pt-3 border-t border-[hsl(var(--border))]">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isBulkOperating}
                    className="w-full gap-2 text-xs h-9"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete {selectedQuizIds.size} {selectedQuizIds.size === 1 ? 'quiz' : 'quizzes'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
        {sortedQuizzes.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No quizzes found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <DataTableHeader>
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isIndeterminate
                        }}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring))] cursor-pointer"
                        title="Select all"
                      />
                    </th>
                    <DataTableHeaderCell className="whitespace-nowrap">ID</DataTableHeaderCell>
                    <DataTableHeaderCell
                      column="title"
                      sortable
                      sorted={sortBy === 'title' ? sortOrder : false}
                      onSort={() => handleSort('title')}
                    >
                      Quiz
                    </DataTableHeaderCell>
                    <DataTableHeaderCell
                      column="status"
                      sortable
                      sorted={sortBy === 'status' ? sortOrder : false}
                      onSort={() => handleSort('status')}
                    >
                      Status
                    </DataTableHeaderCell>
                    <DataTableHeaderCell
                      column="runs"
                      sortable
                      sorted={sortBy === 'runs' ? sortOrder : false}
                      onSort={() => handleSort('runs')}
                    >
                      Runs
                    </DataTableHeaderCell>
                    <DataTableHeaderCell
                      column="publicationDate"
                      sortable
                      sorted={sortBy === 'publicationDate' ? sortOrder : false}
                      onSort={() => handleSort('publicationDate')}
                    >
                      Published
                    </DataTableHeaderCell>
                    <DataTableHeaderCell className="whitespace-nowrap">PDF</DataTableHeaderCell>
                    <DataTableHeaderCell
                      column="createdAt"
                      sortable
                      sorted={sortBy === 'createdAt' ? sortOrder : false}
                      onSort={() => handleSort('createdAt')}
                    >
                      Created
                    </DataTableHeaderCell>
                    <DataTableHeaderCell className="whitespace-nowrap">Actions</DataTableHeaderCell>
                  </tr>
                </DataTableHeader>
                <tbody className="bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))]">
                  {sortedQuizzes.map((quiz) => {
                    const quizId = quizIdMap.get(quiz.id) || null
                    const isSelected = selectedQuizIds.has(quiz.id)
                    
                    return (
                      <tr
                        key={quiz.id}
                        className={`hover:bg-[hsl(var(--muted))]/50 transition-colors ${
                          isSelected ? 'bg-[hsl(var(--primary))]/5' : ''
                        }`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectQuiz(quiz.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring))] cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                          {quizId !== null ? (
                            <span className="text-sm font-mono font-medium text-[hsl(var(--foreground))]">
                              {quizId}
                            </span>
                          ) : (
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">-</span>
                          )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-start">
                            <div className="flex-1 min-w-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/admin/quizzes/${quiz.id}`)
                                }}
                                className="text-sm font-semibold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline text-left block"
                              >
                                {quiz.title}
                              </button>
                              {quiz.blurb && (
                                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-1">
                                  {quiz.blurb}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant={getStatusBadge(quiz.status)}>
                            {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-[hsl(var(--foreground))] font-medium">
                          {quiz._count?.runs ?? 0}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                          {formatDate(quiz.publicationDate)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {quiz.pdfStatus === 'approved' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved
                            </span>
                          ) : quiz.pdfStatus === 'generated' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              <FileText className="w-3 h-3" />
                              Review
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              None
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                          {formatDate(quiz.createdAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/admin/quizzes/builder?edit=${quiz.id}`)
                              }}
                              className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleGeneratePDF(quiz.id)
                              }}
                              disabled={isGeneratingPDF === quiz.id}
                              className="p-2 text-[hsl(var(--muted-foreground))] hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Generate PDF"
                            >
                              {isGeneratingPDF === quiz.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDuplicate(quiz.id)
                              }}
                              className="p-2 text-[hsl(var(--muted-foreground))] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Duplicate quiz"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(quiz.id, quiz.title)
                              }}
                              className="p-2 text-[hsl(var(--muted-foreground))] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete quiz"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {quiz.pdfStatus === 'generated' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/admin/quizzes/${quiz.id}?tab=pdf`)
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors whitespace-nowrap"
                                title="Review PDF"
                              >
                                Review
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-4 border-t border-[hsl(var(--border))] flex items-center justify-between bg-[hsl(var(--muted))]">
                <div className="text-sm text-[hsl(var(--foreground))]">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  {pagination.page > 1 ? (
                    <Link
                      href={`/admin/quizzes?page=${pagination.page - 1}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}`}
                      className="px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl hover:bg-[hsl(var(--muted))] transition-colors"
                    >
                      Previous
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl opacity-50 cursor-not-allowed"
                    >
                      Previous
                    </button>
                  )}
                  {pagination.page < pagination.totalPages ? (
                    <Link
                      href={`/admin/quizzes?page=${pagination.page + 1}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}`}
                      className="px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl hover:bg-[hsl(var(--muted))] transition-colors"
                    >
                      Next
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl opacity-50 cursor-not-allowed"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

