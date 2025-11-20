'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Filter, Building2, Trophy, BookOpen, Edit2, X, KeyRound } from 'lucide-react'
import { PageHeader, Card, Input, Select, DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell, DataTableEmpty, Badge, Button } from '@/components/admin/ui'

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

  const getTierBadge = (tier: string) => {
    return tier === 'premium' ? 'info' : 'default'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage users and their accounts"
      />

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
            <Select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            >
              <option value="">All Tiers</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <DataTable
        isLoading={isLoading}
        emptyState={{
          icon: <Users className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />,
          message: 'No users found'
        }}
      >
        {users.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <DataTableHeader>
                  <tr>
                    <DataTableHeaderCell
                      sortable
                      sorted={sortBy === 'name' ? sortOrder : false}
                      onSort={() => handleSort('name')}
                    >
                      User
                    </DataTableHeaderCell>
                    <DataTableHeaderCell
                      sortable
                      sorted={sortBy === 'tier' ? sortOrder : false}
                      onSort={() => handleSort('tier')}
                    >
                      Tier
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>Organisations</DataTableHeaderCell>
                    <DataTableHeaderCell>Activity</DataTableHeaderCell>
                    <DataTableHeaderCell
                      sortable
                      sorted={sortBy === 'lastLoginAt' ? sortOrder : false}
                      onSort={() => handleSort('lastLoginAt')}
                    >
                      Last Login
                    </DataTableHeaderCell>
                    <DataTableHeaderCell
                      sortable
                      sorted={sortBy === 'createdAt' ? sortOrder : false}
                      onSort={() => handleSort('createdAt')}
                    >
                      Joined
                    </DataTableHeaderCell>
                    <DataTableHeaderCell className="w-20">Actions</DataTableHeaderCell>
                  </tr>
                </DataTableHeader>
                <DataTableBody>
                  {users.map((user) => (
                    <DataTableRow key={user.id}>
                      <DataTableCell>
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
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant={getTierBadge(user.tier)}>
                          {user.tier === 'premium' ? 'Premium' : 'Basic'}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell>
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
                      </DataTableCell>
                      <DataTableCell>
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
                      </DataTableCell>
                      <DataTableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </DataTableCell>
                      <DataTableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </DataTableCell>
                      <DataTableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingUser(user)
                          }}
                          title="Edit user"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
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
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DataTable>

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
            <Input
              label="Name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Select
              label="Tier"
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </Select>

            <Select
              label="Subscription Status"
              value={formData.subscriptionStatus}
              onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value })}
            >
              <option value="FREE_TRIAL">Free Trial</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>

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
              <Button
                type="button"
                variant="secondary"
                onClick={handleResetPassword}
                disabled={isResettingPassword}
              >
                <KeyRound className="w-4 h-4" />
                {isResettingPassword ? 'Sending...' : 'Reset Password'}
              </Button>
              <div className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

