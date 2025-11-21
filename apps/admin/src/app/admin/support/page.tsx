'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HelpCircle, Filter, AlertCircle, Clock, CheckCircle2, User, Building2, Search, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react'
import { PageHeader, Card, Input, Select, DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell, DataTableEmpty, Badge, Button } from '@/components/admin/ui'
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
    const priorityMap: Record<string, 'danger' | 'warning' | 'default'> = {
      HIGH: 'danger',
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
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] z-10" />
            <Input
              type="text"
              placeholder="Search tickets..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] z-10" />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CLOSED">Closed</option>
            </Select>
          </div>
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] z-10" />
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="pl-10"
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card className="overflow-hidden p-0">
        <DataTable>
          <DataTableHeader>
            <tr>
              <DataTableHeaderCell onClick={() => handleSort('subject')} sortable sortDirection={sortBy === 'subject' ? sortOrder : undefined}>
                Subject
              </DataTableHeaderCell>
              <DataTableHeaderCell onClick={() => handleSort('status')} sortable sortDirection={sortBy === 'status' ? sortOrder : undefined}>
                Status
              </DataTableHeaderCell>
              <DataTableHeaderCell onClick={() => handleSort('priority')} sortable sortDirection={sortBy === 'priority' ? sortOrder : undefined}>
                Priority
              </DataTableHeaderCell>
              <DataTableHeaderCell onClick={() => handleSort('userName')} sortable sortDirection={sortBy === 'userName' ? sortOrder : undefined}>
                User
              </DataTableHeaderCell>
              <DataTableHeaderCell onClick={() => handleSort('createdAt')} sortable sortDirection={sortBy === 'createdAt' ? sortOrder : undefined}>
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
                <DataTableCell colSpan={6} className="p-0">
                  <TableSkeleton rows={10} columns={6} />
                </DataTableCell>
              </tr>
            ) : tickets.length === 0 ? (
              <DataTableEmpty colSpan={6} message="No support tickets found" />
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
                        className="h-8 px-3"
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
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="h-8 px-3"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="h-8 px-3"
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
                  className="h-8 w-8 p-0"
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
                  variant="outline"
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
