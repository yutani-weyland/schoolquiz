'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HelpCircle, Filter, AlertCircle, Clock, CheckCircle2, User, Building2, Search, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react'
import { PageHeader, Card, DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell, DataTableEmpty, Badge, Button } from '@/components/admin/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AutocompleteSearch } from '@/components/admin/AutocompleteSearch'
import { useDebounce } from '@/hooks/useDebounce'
import { TableSkeleton } from '@/components/admin/ui/TableSkeleton'
import { formatDate, formatDateTime } from '@/lib/dateUtils'

interface SupportTicket {
  id: string
  subject: string
  status: string
  priority: string
  category: string
  organisationId: string | null
  organisationName: string | null
  userId: string
  userName: string
  userEmail: string
  message: string
  createdAt: string
  updatedAt: string
  assignedTo: string | null
  replies: Array<{
    id: string
    message: string
    createdAt: string
    userId: string
    userName: string
  }>
}

function SupportPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Get initial values from URL params
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Initialize from URL params on mount (client-side only)
  useEffect(() => {
    setMounted(true)
    if (searchParams) {
      const search = searchParams.get('search') || ''
      const status = searchParams.get('status') || ''
      const priority = searchParams.get('priority') || ''
      const pageParam = parseInt(searchParams.get('page') || '1', 10)
      const sortByParam = searchParams.get('sortBy') || 'createdAt'
      const sortOrderParam = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

      setSearchInput(search)
      setStatusFilter(status)
      setPriorityFilter(priority)
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
    if (priorityFilter) params.set('priority', priorityFilter)
    if (page > 1) params.set('page', page.toString())
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder)

    router.push(`?${params.toString()}`, { scroll: false })
  }, [debouncedSearch, statusFilter, priorityFilter, page, sortBy, sortOrder, router])

  // Reset to first page on search
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    if (mounted) {
      fetchTickets()
    }
  }, [mounted, debouncedSearch, statusFilter, priorityFilter, page, sortBy, sortOrder])

  const fetchSearchSuggestions = async (query: string): Promise<string[]> => {
    if (query.length < 2) return []

    try {
      const response = await fetch(`/api/admin/support?search=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()

      if (response.ok && data.tickets) {
        return data.tickets
          .map((ticket: SupportTicket) => [
            ticket.subject,
            ticket.userName,
            ticket.userEmail,
          ])
          .flat()
          .filter((s: string | null | undefined): s is string => Boolean(s))
          .filter((s: string, i: number, arr: string[]) => arr.indexOf(s) === i)
          .slice(0, 10)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }

    return []
  }

  const fetchTickets = async () => {
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
      if (priorityFilter) params.append('priority', priorityFilter)

      const response = await fetch(`/api/admin/support/tickets?${params}`)

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Expected JSON but got:', contentType)
          return
        }
        try {
          const data = await response.json()
          setTickets(data.tickets || [])
          setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 })
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError)
        }
      }
    } catch (error) {
      console.error('Failed to fetch support tickets:', error)
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

  const handleViewDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setShowDetailModal(true)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, 'info' | 'warning' | 'success'> = {
      OPEN: 'info',
      IN_PROGRESS: 'warning',
      CLOSED: 'success',
    }
    return {
      variant: statusMap[status] || 'info',
      label: status === 'IN_PROGRESS' ? 'In Progress' : status.charAt(0) + status.slice(1).toLowerCase(),
    }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, 'error' | 'warning' | 'default'> = {
      HIGH: 'error',
      MEDIUM: 'warning',
      LOW: 'default',
    }
    return {
      variant: priorityMap[priority] || 'default',
      label: priority.charAt(0) + priority.slice(1).toLowerCase(),
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Support"
          description="Manage support tickets and customer inquiries"
        />
        <Card className="overflow-hidden p-0">
          <TableSkeleton rows={10} columns={6} />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Manage support tickets and customer inquiries"
      />

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <AutocompleteSearch
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search tickets..."
              onFetchSuggestions={fetchSearchSuggestions}
              minChars={2}
              maxSuggestions={8}
            />
          </div>
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
            <Select
              value={priorityFilter || "all"}
              onValueChange={(value) => setPriorityFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card className="overflow-hidden p-0">
        <DataTable>
          <DataTableHeader>
            <tr>
              <DataTableHeaderCell sortable sorted={sortBy === 'subject' ? sortOrder : undefined} onSort={() => handleSort('subject')}>
                Subject
              </DataTableHeaderCell>
              <DataTableHeaderCell sortable sorted={sortBy === 'status' ? sortOrder : undefined} onSort={() => handleSort('status')}>
                Status
              </DataTableHeaderCell>
              <DataTableHeaderCell sortable sorted={sortBy === 'priority' ? sortOrder : undefined} onSort={() => handleSort('priority')}>
                Priority
              </DataTableHeaderCell>
              <DataTableHeaderCell sortable sorted={sortBy === 'userName' ? sortOrder : undefined} onSort={() => handleSort('userName')}>
                User
              </DataTableHeaderCell>
              <DataTableHeaderCell sortable sorted={sortBy === 'createdAt' ? sortOrder : undefined} onSort={() => handleSort('createdAt')}>
                Created
              </DataTableHeaderCell>
              <DataTableHeaderCell>
                Actions
              </DataTableHeaderCell>
            </tr>
          </DataTableHeader>
          <DataTableBody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <TableSkeleton rows={10} columns={6} />
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <DataTableEmpty message="No support tickets found" />
            ) : (
              tickets.map((ticket) => {
                const statusBadge = getStatusBadge(ticket.status)
                const priorityBadge = getPriorityBadge(ticket.priority)
                return (
                  <DataTableRow key={ticket.id}>
                    <DataTableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {ticket.subject}
                        </span>
                        {ticket.organisationName && (
                          <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" />
                            {ticket.organisationName}
                          </span>
                        )}
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant={priorityBadge.variant}>
                        {priorityBadge.label}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-[hsl(var(--foreground))]">
                          {ticket.userName}
                        </span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {ticket.userEmail}
                        </span>
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {formatDate(ticket.createdAt)}
                      </span>
                    </DataTableCell>
                    <DataTableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(ticket)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </DataTableCell>
                  </DataTableRow>
                )
              })
            )}
          </DataTableBody>
        </DataTable>

        {/* Pagination */}
        {!isLoading && tickets.length > 0 && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[hsl(var(--border))]">
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tickets
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--background))] rounded-2xl border border-[hsl(var(--border))] max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[hsl(var(--border))]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-2">
                    {selectedTicket.subject}
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant={getStatusBadge(selectedTicket.status).variant}>
                      {getStatusBadge(selectedTicket.status).label}
                    </Badge>
                    <Badge variant={getPriorityBadge(selectedTicket.priority).variant}>
                      {getPriorityBadge(selectedTicket.priority).label}
                    </Badge>
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">
                      {selectedTicket.category}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedTicket(null)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">User Information</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-sm text-[hsl(var(--foreground))]">
                      {selectedTicket.userName} ({selectedTicket.userEmail})
                    </span>
                  </div>
                  {selectedTicket.organisationName && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                      <span className="text-sm text-[hsl(var(--foreground))]">
                        {selectedTicket.organisationName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Message</h3>
                <div className="bg-[hsl(var(--muted))] rounded-xl p-4">
                  <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">
                    {selectedTicket.message}
                  </p>
                </div>
              </div>
              {selectedTicket.replies.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-3">
                    Replies ({selectedTicket.replies.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedTicket.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-l-4 border-blue-500"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                            {reply.userName}
                          </span>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {formatDateTime(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">
                          {reply.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  Created {formatDateTime(selectedTicket.createdAt)} • Updated {formatDateTime(selectedTicket.updatedAt)}
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedTicket(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <PageHeader
          title="Support"
          description="Manage support tickets and customer inquiries"
        />
        <Card className="overflow-hidden p-0">
          <TableSkeleton rows={10} columns={6} />
        </Card>
      </div>
    }>
      <SupportPageContent />
    </Suspense>
  )
}
