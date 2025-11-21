'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Clock, User, Filter, Search, Mail, School, UserCircle, Tag, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, Input, Select, DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell, DataTableEmpty, Badge, Button } from '@/components/admin/ui'
import { useDebounce } from '@/hooks/useDebounce'
import { TableSkeleton } from '@/components/admin/ui/TableSkeleton'

interface UserQuestionSubmission {
  id: string
  userId: string
  userName: string
  userEmail: string
  question: string
  answer: string
  explanation?: string | null
  category?: string | null
  status: string
  reviewedBy?: string | null
  reviewedAt?: string | null
  notes?: string | null
  teacherName?: string | null
  schoolName?: string | null
  consentForShoutout?: boolean
  createdAt: string
}

function UserQuestionSubmissionsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [submissions, setSubmissions] = useState<UserQuestionSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<UserQuestionSubmission | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Get initial values from URL params
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Initialize from URL params on mount (client-side only)
  useEffect(() => {
    setMounted(true)
    if (searchParams) {
      const search = searchParams.get('search') || ''
      const status = searchParams.get('status') || ''
      const pageParam = parseInt(searchParams.get('page') || '1', 10)
      const sortByParam = searchParams.get('sortBy') || 'createdAt'
      const sortOrderParam = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
      
      setSearchInput(search)
      setStatusFilter(status)
      setPage(pageParam)
      setSortBy(sortByParam)
      setSortOrder(sortOrderParam)
    }
  }, [searchParams])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (statusFilter) params.set('status', statusFilter)
    if (page > 1) params.set('page', page.toString())
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder)
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [debouncedSearch, statusFilter, page, sortBy, sortOrder, router])

  // Reset to first page on search
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    fetchSubmissions()
  }, [debouncedSearch, statusFilter, page, sortBy, sortOrder])

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sortBy,
        sortOrder,
      })
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/admin/questions/submissions?${params}`)
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Expected JSON but got:', contentType)
          return
        }
        try {
          const data = await response.json()
        setSubmissions(data.submissions || [])
          setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 })
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError)
        }
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/admin/questions/submissions/${submissionId}/approve`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchSubmissions()
        setShowDetailModal(false)
        setSelectedSubmission(null)
      }
    } catch (error) {
      console.error('Failed to approve submission:', error)
    }
  }

  const handleReject = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/admin/questions/submissions/${submissionId}/reject`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchSubmissions()
        setShowDetailModal(false)
        setSelectedSubmission(null)
      }
    } catch (error) {
      console.error('Failed to reject submission:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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

  const handleViewDetails = (submission: UserQuestionSubmission) => {
    setSelectedSubmission(submission)
    setShowDetailModal(true)
  }

  // Calculate stats from all submissions (would need total count from API)
  const pendingCount = submissions.filter(s => s.status === 'PENDING').length
  const approvedCount = submissions.filter(s => s.status === 'APPROVED').length
  const rejectedCount = submissions.filter(s => s.status === 'REJECTED').length

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            People's Round Submissions
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Review and approve user-submitted questions for the People's Round
          </p>
        </div>
        <Card className="overflow-hidden p-0">
          <TableSkeleton rows={10} columns={6} />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
          People's Round Submissions
        </h1>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Review and approve user-submitted questions for the People's Round
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Pending</div>
          <div className="text-2xl font-bold text-[hsl(var(--foreground))]">
            {pendingCount}
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Approved</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {approvedCount}
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Rejected</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {rejectedCount}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] z-10" />
            <Input
              type="text"
              placeholder="Search questions, users, schools..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 text-xs"
            />
          </div>
        <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] z-10" />
            <Select
            value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="pl-10 text-xs"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <Card className="overflow-hidden p-0">
          <TableSkeleton rows={10} columns={6} />
        </Card>
      ) : (
        <DataTable
          emptyState={{
            icon: <UserCircle className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />,
            message: 'No submissions found'
          }}
        >
          {submissions.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <DataTableHeader>
                    <tr>
                      <DataTableHeaderCell 
                        sortable 
                        sorted={sortBy === 'createdAt' ? sortOrder : undefined}
                        onSort={() => handleSort('createdAt')}
                      >
                        Date
                      </DataTableHeaderCell>
                      <DataTableHeaderCell 
                        sortable 
                        sorted={sortBy === 'status' ? sortOrder : undefined}
                        onSort={() => handleSort('status')}
                      >
                        Status
                      </DataTableHeaderCell>
                      <DataTableHeaderCell>User</DataTableHeaderCell>
                      <DataTableHeaderCell 
                        sortable 
                        sorted={sortBy === 'question' ? sortOrder : undefined}
                        onSort={() => handleSort('question')}
                      >
                        Question
                      </DataTableHeaderCell>
                      <DataTableHeaderCell>Answer</DataTableHeaderCell>
                      <DataTableHeaderCell>Actions</DataTableHeaderCell>
                    </tr>
                  </DataTableHeader>
                  <DataTableBody>
                    {submissions.map((submission) => {
            const statusBadge = getStatusBadge(submission.status)
            const StatusIcon = statusBadge.icon
            
            return (
                        <DataTableRow key={submission.id}>
                          <DataTableCell>
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatDate(submission.createdAt)}
                        </div>
                          </DataTableCell>
                          <DataTableCell>
                            <Badge 
                              variant={submission.status === 'PENDING' ? 'warning' : submission.status === 'APPROVED' ? 'success' : 'danger'}
                              className="text-xs"
                            >
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusBadge.label}
                            </Badge>
                          </DataTableCell>
                          <DataTableCell>
                            <div className="text-xs">
                              <div className="font-medium text-[hsl(var(--foreground))]">{submission.userName}</div>
                              {submission.schoolName && (
                                <div className="text-[hsl(var(--muted-foreground))]">{submission.schoolName}</div>
                              )}
                      </div>
                          </DataTableCell>
                          <DataTableCell>
                            <div className="text-xs text-[hsl(var(--foreground))] max-w-md line-clamp-2">
                          {submission.question}
                            </div>
                          </DataTableCell>
                          <DataTableCell>
                            <div className="text-xs font-medium text-[hsl(var(--foreground))]">
                              {submission.answer}
                            </div>
                          </DataTableCell>
                          <DataTableCell>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewDetails(submission)}
                                className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 rounded-lg transition-colors"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {submission.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(submission.id)}
                                    className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                    title="Approve"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(submission.id)}
                                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </DataTableCell>
                        </DataTableRow>
                      )
                    })}
                  </DataTableBody>
                </table>
                      </div>
                      
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-[hsl(var(--border))] flex items-center justify-between">
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                      </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={pagination.page === 1}
                      className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="text-xs text-[hsl(var(--foreground))]">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </DataTable>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedSubmission(null)
          }}
          onApprove={() => handleApprove(selectedSubmission.id)}
          onReject={() => handleReject(selectedSubmission.id)}
        />
      )}
    </div>
  )
}

function SubmissionDetailModal({
  submission,
  onClose,
  onApprove,
  onReject,
}: {
  submission: UserQuestionSubmission
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}) {
  const statusBadge = getStatusBadge(submission.status)
  const StatusIcon = statusBadge.icon

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      
      // Use consistent formatting to avoid hydration mismatches
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return `${day}/${month}/${year}, ${hours}:${minutes}`
    } catch {
      return dateString
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Submission Details</h2>
            <button
              onClick={onClose}
              className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Status and User Info */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge 
                variant={submission.status === 'PENDING' ? 'warning' : submission.status === 'APPROVED' ? 'success' : 'danger'}
                className="text-xs"
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusBadge.label}
              </Badge>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Submitted {formatDate(submission.createdAt)}
                        </div>
                      </div>
                      
            {/* User Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[hsl(var(--muted))]/30 rounded-xl">
              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">User</div>
                <div className="text-sm font-medium text-[hsl(var(--foreground))]">{submission.userName}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Email</div>
                <div className="text-sm text-[hsl(var(--foreground))]">{submission.userEmail}</div>
              </div>
                      {submission.teacherName && (
                <div>
                  <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Teacher</div>
                  <div className="text-sm text-[hsl(var(--foreground))]">{submission.teacherName}</div>
                        </div>
                      )}
                      {submission.schoolName && (
                <div>
                  <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">School</div>
                  <div className="text-sm text-[hsl(var(--foreground))]">{submission.schoolName}</div>
                        </div>
                      )}
                      {submission.category && (
                <div>
                  <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Suggested Category</div>
                  <div className="text-sm text-[hsl(var(--foreground))]">{submission.category}</div>
                          </div>
              )}
              {submission.consentForShoutout && (
                <div>
                  <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Consent</div>
                  <Badge variant="success" className="text-xs">✓ Consent for shoutout</Badge>
                        </div>
                      )}
                    </div>
                    
            {/* Question */}
            <div>
              <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">Question</div>
              <div className="text-sm font-semibold text-[hsl(var(--foreground))] leading-relaxed p-4 bg-[hsl(var(--muted))]/30 rounded-xl">
                {submission.question}
              </div>
            </div>

            {/* Answer */}
            <div>
              <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">Answer</div>
              <div className="text-sm font-medium text-[hsl(var(--foreground))] p-4 bg-[hsl(var(--muted))]/50 rounded-xl">
                {submission.answer}
                      </div>
                  </div>

            {/* Explanation */}
                {submission.explanation && (
              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">Explanation</div>
                <div className="text-sm text-[hsl(var(--foreground))] leading-relaxed p-4 bg-[hsl(var(--muted))]/30 rounded-xl">
                  {submission.explanation}
                </div>
                  </div>
                )}

            {/* Actions */}
                {submission.status === 'PENDING' && (
              <div className="flex items-center gap-3 pt-4 border-t border-[hsl(var(--border))]">
                <Button
                  onClick={onApprove}
                  variant="success"
                  size="sm"
                  className="gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Create Question
                </Button>
                <Button
                  onClick={onReject}
                  variant="danger"
                  size="sm"
                  className="gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                </Button>
                  </div>
                )}
              </div>
        </div>
      </div>
    </div>
  )
}

function getStatusBadge(status: string) {
  const badges = {
    PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock },
    APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
    REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
  }
  return badges[status as keyof typeof badges] || badges.PENDING
}

export default function UserQuestionSubmissionsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            People's Round Submissions
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Review and approve user-submitted questions for the People's Round
          </p>
        </div>
        <Card className="overflow-hidden p-0">
          <TableSkeleton rows={10} columns={6} />
        </Card>
      </div>
    }>
      <UserQuestionSubmissionsPageContent />
    </Suspense>
  )
}
