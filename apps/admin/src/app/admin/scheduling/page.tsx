'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Filter, Plus, CheckCircle2, XCircle, AlertCircle, Play } from 'lucide-react'

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
      console.log('Scheduled jobs API response:', data)
      
      if (response.ok) {
        setJobs(data.jobs || [])
      } else {
        console.error('API error:', data)
      }
    } catch (error) {
      console.error('Failed to fetch scheduled jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { label: 'Pending', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: Clock },
      SCHEDULED: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: Calendar },
      RUNNING: { label: 'Running', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Play },
      COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
      FAILED: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
      CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: XCircle },
    }
    return badges[status as keyof typeof badges] || badges.PENDING
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Scheduling
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage scheduled jobs, quiz publications, and maintenance windows
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)]">
          <Plus className="w-4 h-4" />
          Create Job
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 z-10" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
              }}
              className="pl-10 pr-8 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            >
              <option value="">All Types</option>
              <option value="PUBLISH_QUIZ">Publish Quiz</option>
              <option value="OPEN_QUIZ_RUN">Open Quiz Run</option>
              <option value="CLOSE_QUIZ_RUN">Close Quiz Run</option>
              <option value="MAINTENANCE_WINDOW">Maintenance Window</option>
              <option value="SEND_NOTIFICATION">Send Notification</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 z-10" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
              }}
              className="pl-10 pr-8 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="RUNNING">Running</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading scheduled jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No scheduled jobs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Scheduled For
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Next Run
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Recurring
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  {jobs.map((job) => {
                    const statusBadge = getStatusBadge(job.status)
                    const StatusIcon = statusBadge.icon
                    return (
                      <tr
                        key={job.id}
                        className="hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-gray-100/40 dark:hover:from-gray-700/30 dark:hover:to-gray-700/20 transition-all duration-200 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {job.name}
                            </div>
                            {job.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {job.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {getTypeLabel(job.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(job.scheduledFor)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {job.nextRunAt ? formatDate(job.nextRunAt) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {job.isRecurring ? (
                            <span className="inline-flex items-center gap-1">
                              <span>Yes</span>
                              {job.recurrencePattern && (
                                <span className="text-xs text-gray-400">({job.recurrencePattern})</span>
                              )}
                            </span>
                          ) : (
                            'No'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

