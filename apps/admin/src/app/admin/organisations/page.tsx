'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Search, Filter, Users, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Edit2, X } from 'lucide-react'

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
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [editingOrg, setEditingOrg] = useState<Organisation | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchOrganisations()
  }, [searchQuery, statusFilter, page, sortBy, sortOrder])

  const fetchOrganisations = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sortBy,
        sortOrder,
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

  const getStatusBadge = (status: string) => {
    const styles = {
      TRIALING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      PAST_DUE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      CANCELLED: 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]',
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
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            Organisations
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Manage organisations and their members
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
              placeholder="Search organisations..."
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="pl-10 pr-8 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
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
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Loading organisations...</p>
          </div>
        ) : organisations.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No organisations found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                  <tr>
                    <SortableHeader column="name" label="Organisation" />
                    <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Owner
                    </th>
                    <SortableHeader column="status" label="Status" />
                    <SortableHeader column="members" label="Members" />
                    <SortableHeader column="plan" label="Plan" />
                    <SortableHeader column="createdAt" label="Created" />
                    <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[hsl(var(--card))]/50 divide-y divide-[hsl(var(--border))]">
                  {organisations.map((org) => (
                    <tr
                      key={org.id}
                      className="hover:bg-[hsl(var(--muted))] transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="w-5 h-5 text-[hsl(var(--muted-foreground))] mr-3" />
                          <div>
                            <div className="text-sm font-medium text-[hsl(var(--foreground))]">
                              {org.name}
                            </div>
                            {org.emailDomain && (
                              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                @{org.emailDomain}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[hsl(var(--foreground))]">
                          {org.owner.name || 'N/A'}
                        </div>
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">
                          {org.owner.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(org.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-[hsl(var(--foreground))]">
                          <Users className="w-4 h-4 mr-1 text-[hsl(var(--muted-foreground))]" />
                          {org._count.members} / {org.maxSeats || '∞'}
                        </div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {org._count.groups} groups
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--foreground))]">
                        {org.plan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingOrg(org)
                            }}
                            className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
                            title="Edit organisation"
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

      {/* Edit Organisation Modal */}
      <AnimatePresence>
        {editingOrg && (
          <EditOrganisationModal
            organisation={editingOrg}
            onClose={() => setEditingOrg(null)}
            onSave={async () => {
              setEditingOrg(null)
              await fetchOrganisations()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EditOrganisationModal({ organisation, onClose, onSave }: { organisation: Organisation; onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: organisation.name,
    emailDomain: organisation.emailDomain || '',
    status: organisation.status,
    plan: organisation.plan,
    maxSeats: organisation.maxSeats.toString(),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/admin/organisations/${organisation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxSeats: parseInt(formData.maxSeats) || 0,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update organisation')
      }

      setSuccess('Organisation updated successfully')
      setTimeout(() => {
        onSave()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to update organisation')
    } finally {
      setIsLoading(false)
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
            <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Edit Organisation</h2>
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
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Email Domain
              </label>
              <input
                type="text"
                value={formData.emailDomain}
                onChange={(e) => setFormData({ ...formData, emailDomain: e.target.value })}
                placeholder="example.com"
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              >
                <option value="TRIALING">Trial</option>
                <option value="ACTIVE">Active</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Plan
              </label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="ORG_MONTHLY">Organisation Monthly</option>
                <option value="ORG_ANNUAL">Organisation Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Max Seats
              </label>
              <input
                type="number"
                value={formData.maxSeats}
                onChange={(e) => setFormData({ ...formData, maxSeats: e.target.value })}
                min="0"
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
              />
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
                className="px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

