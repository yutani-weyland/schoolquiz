'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, Filter, AlertCircle, Clock, CheckCircle2, User, Building2 } from 'lucide-react'
import { PageHeader, Card, Select, Badge } from '@/components/admin/ui'

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

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [statusFilter, priorityFilter])

  const fetchTickets = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (priorityFilter) params.append('priority', priorityFilter)

      const response = await fetch(`/api/admin/support/tickets?${params}`)
      const data = await response.json()
      console.log('Support tickets API response:', data)
      
      if (response.ok) {
        setTickets(data.tickets || [])
      } else {
        console.error('API error:', data)
      }
    } catch (error) {
      console.error('Failed to fetch support tickets:', error)
    } finally {
      setIsLoading(false)
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, 'info' | 'warning' | 'success'> = {
      OPEN: 'info',
      IN_PROGRESS: 'warning',
      CLOSED: 'success',
    }
    const iconMap: Record<string, typeof AlertCircle> = {
      OPEN: AlertCircle,
      IN_PROGRESS: Clock,
      CLOSED: CheckCircle2,
    }
    return {
      variant: statusMap[status] || 'info',
      icon: iconMap[status] || AlertCircle,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
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
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
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
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
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

      {/* Tickets */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <HelpCircle className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
              <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No support tickets found</p>
            </div>
          </Card>
        ) : (
          tickets.map((ticket) => {
            const statusBadge = getStatusBadge(ticket.status)
            const priorityBadge = getPriorityBadge(ticket.priority)
            const StatusIcon = statusBadge.icon
            return (
              <Card key={ticket.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                        {ticket.subject}
                      </h3>
                      <Badge variant={statusBadge.variant} icon={StatusIcon}>
                        {statusBadge.label}
                      </Badge>
                      <Badge variant={priorityBadge.variant}>
                        {priorityBadge.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{ticket.userName} ({ticket.userEmail})</span>
                      </div>
                      {ticket.organisationName && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span>{ticket.organisationName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span>{ticket.replies.length} replies</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-[hsl(var(--muted-foreground))]">
                    <p>{formatDate(ticket.createdAt)}</p>
                    <p className="text-xs mt-1">Updated {formatDate(ticket.updatedAt)}</p>
                  </div>
                </div>
                <div className="bg-[hsl(var(--muted))] rounded-xl p-4 mb-4">
                  <p className="text-sm text-[hsl(var(--foreground))]">{ticket.message}</p>
                </div>
                {ticket.replies.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-[hsl(var(--foreground))]">Replies:</h4>
                    {ticket.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border-l-4 border-blue-500"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                            {reply.userName}
                          </span>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-[hsl(var(--foreground))]">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

