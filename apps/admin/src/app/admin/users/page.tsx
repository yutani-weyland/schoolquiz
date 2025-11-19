'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Filter, Building2, Trophy, BookOpen, ArrowUpDown, ArrowUp, ArrowDown, Edit2, X, KeyRound } from 'lucide-react'

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
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchUsers()
  }, [searchQuery, tierFilter, page, sortBy, sortOrder])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sortBy,
        sortOrder,
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

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const SortableHeader = ({ column, label }: { column: string; label: string }) => {
    const isSorted = sortBy === column
    return (
      <th
        className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider cursor-pointer hover:bg-[hsl(var(--muted))] transition-colors"
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {isSorted ? (
            sortOrder === 'asc' ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )
          ) : (
            <ArrowUpDown className="w-4 h-4 opacity-50" />
          )}
        </div>
      </th>
    )
  }

  const getTierBadge = (tier: string) => {
    return tier === 'premium' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
        Premium
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
        Basic
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            Users
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Manage users and their accounts
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value)
                setPage(1)
              }}
              className="pl-10 pr-8 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            >
              <option value="">All Tiers</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                  <tr>
                    <SortableHeader column="name" label="User" />
                    <SortableHeader column="tier" label="Tier" />
                    <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Organisations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Activity
                    </th>
                    <SortableHeader column="lastLoginAt" label="Last Login" />
                    <SortableHeader column="createdAt" label="Joined" />
                    <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[hsl(var(--card))]/50 divide-y divide-[hsl(var(--border))]">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-[hsl(var(--muted))] transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {(user.name || user.email)[0].toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-[hsl(var(--foreground))]">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-sm text-[hsl(var(--muted-foreground))]">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTierBadge(user.tier)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-[hsl(var(--foreground))]">
                          <Building2 className="w-4 h-4 mr-1 text-[hsl(var(--muted-foreground))]" />
                          {user._count.organisationMembers}
                        </div>
                        {user.organisationMembers.length > 0 && (
                          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                            {user.organisationMembers[0].organisation.name}
                            {user.organisationMembers.length > 1 && ` +${user.organisationMembers.length - 1}`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm text-[hsl(var(--foreground))]">
                          <div className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-1 text-[hsl(var(--muted-foreground))]" />
                            {user._count.quizCompletions}
                          </div>
                          <div className="flex items-center">
                            <Trophy className="w-4 h-4 mr-1 text-[hsl(var(--muted-foreground))]" />
                            {user._count.achievements}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingUser(user)
                            }}
                            className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-[hsl(var(--border))] flex items-center justify-between bg-[hsl(var(--muted))]">
                <div className="text-sm text-[hsl(var(--foreground))]">
                  Showing {((page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl hover:bg-[hsl(var(--muted))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl hover:bg-[hsl(var(--muted))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={async () => {
              setEditingUser(null)
              await fetchUsers()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EditUserModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
    tier: user.tier,
    subscriptionStatus: user.subscriptionStatus,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      setSuccess('User updated successfully')
      setTimeout(() => {
        onSave()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to update user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!confirm('Are you sure you want to reset this user\'s password? They will receive an email with instructions.')) {
      return
    }

    setIsResettingPassword(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setSuccess('Password reset email sent successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl border border-[hsl(var(--border))] max-w-lg w-full p-6 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Edit User</h2>
            <button
              onClick={onClose}
              className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Tier
              </label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
              >
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Subscription Status
              </label>
              <select
                value={formData.subscriptionStatus}
                onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value })}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
              >
                <option value="FREE_TRIAL">Free Trial</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/30 rounded-lg text-sm text-[hsl(var(--destructive))]">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-500">
                {success}
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-[hsl(var(--border))]">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResettingPassword}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <KeyRound className="w-4 h-4" />
                {isResettingPassword ? 'Sending...' : 'Reset Password'}
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

