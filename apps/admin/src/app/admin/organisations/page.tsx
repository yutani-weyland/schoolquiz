'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Search, Filter, Users, Calendar } from 'lucide-react'

interface Organisation {
  id: string
  name: string
  emailDomain?: string | null
  status: string
  plan: string
  maxSeats: number
  currentPeriodEnd?: string | null
  owner: {
    id: string
    name?: string | null
    email: string
  }
  _count: {
    members: number
    groups: number
  }
  createdAt: string
}

export default function AdminOrganisationsPage() {
  const router = useRouter()
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchOrganisations()
  }, [searchQuery, statusFilter, page])

  const fetchOrganisations = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/admin/organisations?${params}`)
      const data = await response.json()
      console.log('Organisations API response:', data)
      
      if (response.ok) {
        setOrganisations(data.organisations || [])
        setPagination(data.pagination || pagination)
      } else {
        console.error('API error:', data)
      }
    } catch (error) {
      console.error('Failed to fetch organisations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      TRIALING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      PAST_DUE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.CANCELLED
        }`}
      >
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Organisations
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage organisations and their members
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 z-10" />
            <input
              type="text"
              placeholder="Search organisations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 z-10" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="pl-10 pr-8 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            >
              <option value="">All Statuses</option>
              <option value="TRIALING">Trial</option>
              <option value="ACTIVE">Active</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading organisations...</p>
          </div>
        ) : organisations.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No organisations found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Organisation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  {organisations.map((org) => (
                    <tr
                      key={org.id}
                      onClick={() => router.push(`/admin/organisations/${org.id}`)}
                      className="hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-gray-100/40 dark:hover:from-gray-700/30 dark:hover:to-gray-700/20 cursor-pointer transition-all duration-200 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {org.name}
                            </div>
                            {org.emailDomain && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                @{org.emailDomain}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {org.owner.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {org.owner.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(org.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <Users className="w-4 h-4 mr-1 text-gray-400" />
                          {org._count.members} / {org.maxSeats || '∞'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {org._count.groups} groups
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {org.plan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
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

