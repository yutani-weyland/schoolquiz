'use client'

import { useState, useEffect } from 'react'
import { FileText, Filter, User, Target, Building2, CreditCard, BookOpen } from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  userId: string
  userName: string
  targetType: string
  targetId: string
  targetName: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  createdAt: string
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchLogs()
  }, [actionFilter, page])

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (actionFilter) params.append('action', actionFilter)

      const response = await fetch(`/api/admin/system/audit-log?${params}`)
      const data = await response.json()
      console.log('Audit log API response:', data)
      
      if (response.ok) {
        setLogs(data.logs || [])
        setPagination(data.pagination || pagination)
      } else {
        console.error('API error:', data)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
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

  const getActionIcon = (action: string) => {
    if (action.includes('USER')) return User
    if (action.includes('ORGANISATION')) return Building2
    if (action.includes('QUIZ')) return BookOpen
    if (action.includes('SUBSCRIPTION') || action.includes('BILLING')) return CreditCard
    if (action.includes('FEATURE')) return Target
    return FileText
  }

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'text-green-600 dark:text-green-400'
    if (action.includes('UPDATED')) return 'text-blue-600 dark:text-blue-400'
    if (action.includes('DELETED') || action.includes('CANCELLED')) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-500" />
          Audit Log
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          View system audit logs and track all administrative actions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 z-10" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(1)
            }}
            className="pl-10 pr-8 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
          >
            <option value="">All Actions</option>
            <option value="USER_ROLE_UPDATED">User Role Updated</option>
            <option value="ORGANISATION_CREATED">Organisation Created</option>
            <option value="QUIZ_PUBLISHED">Quiz Published</option>
            <option value="SUBSCRIPTION_CANCELLED">Subscription Cancelled</option>
            <option value="FEATURE_FLAG_UPDATED">Feature Flag Updated</option>
          </select>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No audit logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  {logs.map((log) => {
                    const ActionIcon = getActionIcon(log.action)
                    const actionColor = getActionColor(log.action)
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-gray-100/40 dark:hover:from-gray-700/30 dark:hover:to-gray-700/20 transition-all duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <ActionIcon className={`w-4 h-4 ${actionColor}`} />
                            <span className={`text-sm font-medium ${actionColor}`}>
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {log.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.targetName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {log.targetType}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <details className="cursor-pointer">
                            <summary className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                              View details
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {log.ipAddress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(log.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

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

