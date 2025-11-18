'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Search, Filter, Building2, Trophy, BookOpen } from 'lucide-react'

interface User {
  id: string
  name?: string | null
  email: string
  tier: string
  subscriptionStatus: string
  organisationMembers: Array<{
    organisation: {
      id: string
      name: string
    }
  }>
  _count: {
    organisationMembers: number
    quizCompletions: number
    achievements: number
  }
  lastLoginAt?: string | null
  createdAt: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchUsers()
  }, [searchQuery, tierFilter, page])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (searchQuery) params.append('search', searchQuery)
      if (tierFilter) params.append('tier', tierFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()
      console.log('Users API response:', data)
      
      if (response.ok) {
        setUsers(data.users || [])
        setPagination(data.pagination || pagination)
      } else {
        console.error('API error:', data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTierBadge = (tier: string) => {
    return tier === 'premium' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
        Premium
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        Basic
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Users
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage users and their accounts
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
              placeholder="Search users..."
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
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value)
                setPage(1)
              }}
              className="pl-10 pr-8 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            >
              <option value="">All Tiers</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Organisations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                      className="hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-gray-100/40 dark:hover:from-gray-700/30 dark:hover:to-gray-700/20 cursor-pointer transition-all duration-200 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {(user.name || user.email)[0].toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTierBadge(user.tier)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <Building2 className="w-4 h-4 mr-1 text-gray-400" />
                          {user._count.organisationMembers}
                        </div>
                        {user.organisationMembers.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {user.organisationMembers[0].organisation.name}
                            {user.organisationMembers.length > 1 && ` +${user.organisationMembers.length - 1}`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-1 text-gray-400" />
                            {user._count.quizCompletions}
                          </div>
                          <div className="flex items-center">
                            <Trophy className="w-4 h-4 mr-1 text-gray-400" />
                            {user._count.achievements}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
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

