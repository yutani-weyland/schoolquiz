'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, FileDown, Calendar, Users, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'
import { DataTable, Column } from '@/components/admin/DataTable'

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
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchQuizzes()
  }, [page])

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })

      const response = await fetch(`/api/admin/quizzes?${params}`)
      const data = await response.json()
      console.log('Quizzes API response:', data)
      
      if (response.ok) {
        setQuizzes(data.quizzes || [])
        setPagination(data.pagination || pagination)
      } else {
        console.error('API error:', data)
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Quizzes
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage quizzes, view analytics, and schedule publications
          </p>
        </div>
        <Link
          href="/admin/quizzes/builder"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
        >
          <Plus className="w-4 h-4" />
          Create Quiz
        </Link>
      </div>

      {/* Table */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No quizzes found</p>
          </div>
        ) : (
          <>
            <DataTable
              data={quizzes}
              columns={[
                {
                  key: 'title',
                  label: 'Quiz',
                  sortable: true,
                  filterable: false,
                  render: (_, quiz) => (
                    <div className="flex items-center">
                      <BookOpen className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/quizzes/${quiz.id}`)
                          }}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline text-left"
                        >
                          {quiz.title}
                        </button>
                        {quiz.blurb && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {quiz.blurb}
                          </div>
                        )}
                        {quiz.theme && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {quiz.theme}
                            </span>
                            {quiz.audience && (
                              <>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {quiz.audience}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  label: 'Status',
                  sortable: true,
                  filterable: true,
                  filterType: 'select',
                  filterOptions: [
                    { label: 'All Statuses', value: '' },
                    { label: 'Draft', value: 'draft' },
                    { label: 'Scheduled', value: 'scheduled' },
                    { label: 'Published', value: 'published' },
                  ],
                  render: (status) => getStatusBadge(status),
                },
                {
                  key: '_count.rounds',
                  label: 'Rounds',
                  sortable: true,
                  render: (_, quiz) => quiz._count.rounds,
                },
                {
                  key: '_count.runs',
                  label: 'Runs',
                  sortable: true,
                  render: (_, quiz) => quiz._count.runs,
                },
                {
                  key: 'publicationDate',
                  label: 'Published',
                  sortable: true,
                  filterable: true,
                  filterType: 'date',
                  render: (date) => formatDate(date),
                },
                {
                  key: 'createdAt',
                  label: 'Created',
                  sortable: true,
                  filterable: true,
                  filterType: 'date',
                  render: (date) => formatDate(date),
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  sortable: false,
                  render: (_, quiz) => (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/quizzes/builder?edit=${quiz.id}`)
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      {quiz.status === 'published' && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              const response = await fetch(`/api/admin/quizzes/${quiz.id}/pdf`, {
                                method: 'POST',
                              })
                              const data = await response.json()
                              if (response.ok && data.pdfUrl) {
                                window.open(data.pdfUrl, '_blank')
                              } else {
                                alert(data.error || 'Failed to generate PDF')
                              }
                            } catch (error) {
                              console.error('Failed to generate PDF:', error)
                              alert('Failed to generate PDF')
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors inline-flex items-center gap-1"
                          title="Generate PDF"
                        >
                          <FileDown className="w-3 h-3" />
                          PDF
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
              defaultSort={{ key: 'createdAt', direction: 'desc' }}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between bg-gradient-to-br from-gray-50/50 to-white/30 dark:from-gray-900/30 dark:to-gray-800/20">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 rounded-xl hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-700 dark:hover:to-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all duration-200"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 rounded-xl hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-700 dark:hover:to-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

