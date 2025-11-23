'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Filter, Plus, CheckCircle2, XCircle, AlertCircle, Play } from 'lucide-react'
import { CreateJobModal } from '@/components/admin/scheduling/CreateJobModal'
import { PageHeader, Card, Button, Badge, DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell, DataTableEmpty } from '@/components/admin/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ScheduledJob {
  id: string
  type: string
  status: string
  name: string
  description?: string | null
  scheduledFor: string
  executedAt?: string | null
  nextRunAt?: string | null
  config: string
  attempts: number
  maxAttempts: number
  lastError?: string | null
  result?: string | null
  isRecurring: boolean
  recurrencePattern?: string | null
  createdAt: string
  updatedAt: string
  createdBy?: string | null
}

export default function AdminSchedulingPage() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [typeFilter, statusFilter])

  const fetchJobs = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (typeFilter) params.append('type', typeFilter)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/admin/scheduling/jobs?${params}`)
      const data = await response.json()

      if (response.ok) {
        setJobs(data.jobs || [])
      } else {
        console.error('API error:', data)
        // Set empty array on error
        setJobs([])
      }
    } catch (error) {
      console.error('Failed to fetch scheduled jobs:', error)
      setJobs([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
      PENDING: 'default',
      SCHEDULED: 'info',
      RUNNING: 'warning',
      COMPLETED: 'success',
      FAILED: 'error',
      CANCELLED: 'default',
    }
    const iconMap: Record<string, typeof Clock> = {
      PENDING: Clock,
      SCHEDULED: Calendar,
      RUNNING: Play,
      COMPLETED: CheckCircle2,
      FAILED: XCircle,
      CANCELLED: XCircle,
    }
    return {
      variant: statusMap[status] || 'default',
      icon: iconMap[status] || Clock,
      label: status.charAt(0) + status.slice(1).toLowerCase(),
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PUBLISH_QUIZ: 'Publish Quiz',
      OPEN_QUIZ_RUN: 'Open Quiz Run',
      CLOSE_QUIZ_RUN: 'Close Quiz Run',
      MAINTENANCE_WINDOW: 'Maintenance Window',
      SEND_NOTIFICATION: 'Send Notification',
      CUSTOM: 'Custom',
    }
    return labels[type] || type
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduling"
        description="Manage scheduled jobs, quiz publications, and maintenance windows"
        action={
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </Button>
        }
      />

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
            <Select
              value={typeFilter || "all"}
              onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PUBLISH_QUIZ">Publish Quiz</SelectItem>
                <SelectItem value="OPEN_QUIZ_RUN">Open Quiz Run</SelectItem>
                <SelectItem value="CLOSE_QUIZ_RUN">Close Quiz Run</SelectItem>
                <SelectItem value="MAINTENANCE_WINDOW">Maintenance Window</SelectItem>
                <SelectItem value="SEND_NOTIFICATION">Send Notification</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="RUNNING">Running</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Jobs Table */}
      <DataTable isLoading={isLoading}>
        {!isLoading && jobs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <DataTableHeader>
                <DataTableHeaderCell>Job</DataTableHeaderCell>
                <DataTableHeaderCell>Type</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell>Scheduled For</DataTableHeaderCell>
                <DataTableHeaderCell>Next Run</DataTableHeaderCell>
                <DataTableHeaderCell>Recurring</DataTableHeaderCell>
                <DataTableHeaderCell>Actions</DataTableHeaderCell>
              </DataTableHeader>
              <DataTableBody>
                {jobs.map((job) => {
                  const statusBadge = getStatusBadge(job.status)
                  const StatusIcon = statusBadge.icon
                  return (
                    <DataTableRow key={job.id}>
                      <DataTableCell>
                        <div>
                          <div className="text-sm font-medium text-[hsl(var(--foreground))]">
                            {job.name}
                          </div>
                          {job.description && (
                            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                              {job.description}
                            </div>
                          )}
                        </div>
                      </DataTableCell>
                      <DataTableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                        {getTypeLabel(job.type)}
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant={statusBadge.variant} icon={StatusIcon}>
                          {statusBadge.label}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                        {formatDate(job.scheduledFor)}
                      </DataTableCell>
                      <DataTableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                        {job.nextRunAt ? formatDate(job.nextRunAt) : '—'}
                      </DataTableCell>
                      <DataTableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                        {job.isRecurring ? (
                          <span className="inline-flex items-center gap-1">
                            <span>Yes</span>
                            {job.recurrencePattern && (
                              <span className="text-xs text-[hsl(var(--muted-foreground))]">({job.recurrencePattern})</span>
                            )}
                          </span>
                        ) : (
                          'No'
                        )}
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex items-center gap-2">
                          {(job.status === 'PENDING' || job.status === 'SCHEDULED') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`Execute job "${job.name}" now?`)) {
                                  try {
                                    const response = await fetch(`/api/admin/scheduling/jobs/${job.id}/execute`, {
                                      method: 'POST',
                                    })
                                    const data = await response.json()
                                    if (response.ok) {
                                      alert('Job executed successfully!')
                                      fetchJobs()
                                    } else {
                                      alert(data.error || 'Failed to execute job')
                                    }
                                  } catch (error) {
                                    console.error('Failed to execute job:', error)
                                    alert('Failed to execute job')
                                  }
                                }
                              }}
                              title="Execute now"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (confirm(`Delete job "${job.name}"? This action cannot be undone.`)) {
                                try {
                                  const response = await fetch(`/api/admin/scheduling/jobs/${job.id}`, {
                                    method: 'DELETE',
                                  })
                                  const data = await response.json()
                                  if (response.ok) {
                                    fetchJobs()
                                  } else {
                                    alert(data.error || 'Failed to delete job')
                                  }
                                } catch (error) {
                                  console.error('Failed to delete job:', error)
                                  alert('Failed to delete job')
                                }
                              }
                            }}
                            title="Delete job"
                            className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]/80"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  )
                })}
              </DataTableBody>
            </table>
          </div>
        )}
        {!isLoading && jobs.length === 0 && (
          <DataTableEmpty message="No scheduled jobs found" />
        )}
      </DataTable>

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchJobs()
        }}
      />
    </div>
  )
}

