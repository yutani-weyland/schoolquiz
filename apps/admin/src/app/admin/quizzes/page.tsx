'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, FileDown, Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, FileText } from 'lucide-react'
import Link from 'next/link'

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
  specialEdition?: boolean | null
  createdAt: string
  updatedAt: string
  _count: {
    rounds: number
    runs: number
  }
}

export default function AdminQuizzesPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchQuizzes()
  }, [searchQuery, statusFilter, page, sortBy, sortOrder])

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/admin/quizzes?${params}`)
      
      // Read response as text first to check if it's HTML
      const text = await response.text()
      
      // Check if response looks like HTML (error page)
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.trim().startsWith('<!')) {
        console.error('API returned HTML instead of JSON. This usually means the route does not exist or returned an error page.')
        console.error('Response preview:', text.substring(0, 500))
        throw new Error('API endpoint returned HTML error page. Check if /api/admin/quizzes route exists.')
      }
      
      // Try to parse as JSON
      let data
      try {
        data = JSON.parse(text)
      } catch (jsonError: any) {
        console.error('Failed to parse JSON response. Error:', jsonError.message)
        console.error('Response preview:', text.substring(0, 500))
        throw new Error(`Invalid JSON response: ${jsonError.message}`)
      }
      console.log('Quizzes API response:', data)
      
      if (response.ok) {
        let fetchedQuizzes = data.quizzes || []
        
        // Client-side sorting
        fetchedQuizzes = [...fetchedQuizzes].sort((a, b) => {
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
        
        setQuizzes(fetchedQuizzes)
        setPagination(data.pagination || pagination)
      } else {
        console.error('API error response:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          error: data.error,
          details: data.details,
          errorName: data.errorName,
        })
        // Show user-friendly error
        alert(`Failed to load quizzes: ${data.details || data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
      // Set empty state on error
      setQuizzes([])
      setPagination({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const SortableHeader = ({ column, label }: { column: string; label: string }) => {
    const isSorted = sortBy === column
    return (
      <th
        className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider cursor-pointer hover:bg-[hsl(var(--muted))] transition-colors whitespace-nowrap"
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {isSorted ? (
            sortOrder === 'asc' ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )
          ) : (
            <ArrowUpDown className="w-4 h-4 opacity-50" />
          )}
        </div>
      </th>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]',
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.draft
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
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
        // Refresh the quiz list
        await fetchQuizzes()
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
        // Refresh the quiz list
        await fetchQuizzes()
        alert(`Quiz duplicated successfully! New quiz: "${data.quiz.title}"`)
      } else {
        alert(data.error || 'Failed to duplicate quiz')
      }
    } catch (error) {
      console.error('Failed to duplicate quiz:', error)
      alert('Failed to duplicate quiz')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            Quizzes
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Manage quizzes, view analytics, and schedule publications
          </p>
        </div>
        <Link
          href="/admin/quizzes/builder"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl font-medium hover:bg-[hsl(var(--primary))]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Quiz
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="pl-10 pr-8 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
        <Suspense fallback={
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Loading quizzes...</p>
          </div>
        }>
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
              <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Loading quizzes...</p>
            </div>
          ) : quizzes.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No quizzes found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider whitespace-nowrap">
                      ID
                    </th>
                    <SortableHeader column="title" label="Quiz" />
                    <SortableHeader column="status" label="Status" />
                    <SortableHeader column="runs" label="Runs" />
                    <SortableHeader column="publicationDate" label="Published" />
                    <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider whitespace-nowrap">
                      PDF
                    </th>
                    <SortableHeader column="createdAt" label="Created" />
                    <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))]">
                  {(() => {
                    // Calculate quiz IDs: Sort published quizzes by publication date
                    // Special editions are excluded from the numbering
                    const publishedQuizzes = quizzes
                      .filter(q => q.status === 'published' && !(q.specialEdition === true))
                      .sort((a, b) => {
                        const dateA = a.publicationDate ? new Date(a.publicationDate).getTime() : 0
                        const dateB = b.publicationDate ? new Date(b.publicationDate).getTime() : 0
                        return dateA - dateB
                      })
                    
                    const quizIdMap = new Map<string, number>()
                    publishedQuizzes.forEach((q, idx) => {
                      quizIdMap.set(q.id, idx + 1)
                    })
                    
                    return quizzes.map((quiz, index) => {
                      const isSpecialEdition = quiz.specialEdition === true
                      const quizId = isSpecialEdition 
                        ? 'SE' 
                        : quizIdMap.get(quiz.id) || null
                    
                    return (
                    <tr
                      key={quiz.id}
                      className="hover:bg-[hsl(var(--muted))]/50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {quizId !== null ? (
                            <span className="text-sm font-mono font-medium text-[hsl(var(--foreground))]">
                              {quizId}
                            </span>
                          ) : (
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">-</span>
                          )}
                          {isSpecialEdition && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                              SE
                            </span>
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
                        {getStatusBadge(quiz.status)}
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
                            className="px-3 py-1.5 text-xs font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDuplicate(quiz.id)
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors whitespace-nowrap"
                            title="Duplicate quiz"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(quiz.id, quiz.title)
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors whitespace-nowrap"
                            title="Delete quiz"
                          >
                            Delete
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
                  })
                  })()}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-4 border-t border-[hsl(var(--border))] flex items-center justify-between bg-[hsl(var(--muted))]">
                <div className="text-sm text-[hsl(var(--foreground))]">
                  Showing {((page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl hover:bg-[hsl(var(--muted))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl hover:bg-[hsl(var(--muted))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </Suspense>
      </div>
    </div>
  )
}

