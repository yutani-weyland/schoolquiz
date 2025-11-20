'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Search, Filter, Users, Calendar, Edit2, X } from 'lucide-react'
import { PageHeader, Card, Input, Select, DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell, DataTableEmpty, Badge, Button } from '@/components/admin/ui'

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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
      TRIALING: 'info',
      ACTIVE: 'success',
      PAST_DUE: 'warning',
      CANCELLED: 'default',
      EXPIRED: 'error',
    }
    return statusMap[status] || 'default'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organisations"
        description="Manage organisations and their members"
      />

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
            <Input
              type="text"
              placeholder="Search organisations..."
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            >
              <option value="">All Statuses</option>
              <option value="TRIALING">Trial</option>
              <option value="ACTIVE">Active</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <DataTable
        isLoading={isLoading}
        emptyState={{
          icon: <Building2 className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />,
          message: 'No organisations found'
        }}
      >
        {organisations.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <DataTableHeader>
                  <tr>
                    <DataTableHeaderCell
                      column="name"
                      sortable
                      sorted={sortBy === 'name' ? sortOrder : false}
                      onSort={() => handleSort('name')}
                    >
                      Organisation
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>Owner</DataTableHeaderCell>
                    <DataTableHeaderCell
                      sortable
                      sorted={sortBy === 'status' ? sortOrder : false}
                      onSort={() => handleSort('status')}
                    >
                      Status
                    </DataTableHeaderCell>
                    <DataTableHeaderCell
                      sortable
                      sorted={sortBy === 'members' ? sortOrder : false}
                      onSort={() => handleSort('members')}
                    >
                      Members
                    </DataTableHeaderCell>
                    <DataTableHeaderCell
                      sortable
                      sorted={sortBy === 'plan' ? sortOrder : false}
                      onSort={() => handleSort('plan')}
                    >
                      Plan
                    </DataTableHeaderCell>
                    <DataTableHeaderCell
                      sortable
                      sorted={sortBy === 'createdAt' ? sortOrder : false}
                      onSort={() => handleSort('createdAt')}
                    >
                      Created
                    </DataTableHeaderCell>
                    <DataTableHeaderCell className="w-20">Actions</DataTableHeaderCell>
                  </tr>
                </DataTableHeader>
                <DataTableBody>
                  {organisations.map((org) => (
                    <DataTableRow key={org.id}>
                      <DataTableCell>
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
                      </DataTableCell>
                      <DataTableCell>
                        <div className="text-sm text-[hsl(var(--foreground))]">
                          {org.owner.name || 'N/A'}
                        </div>
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">
                          {org.owner.email}
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant={getStatusBadge(org.status)}>
                          {org.status}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex items-center text-sm text-[hsl(var(--foreground))]">
                          <Users className="w-4 h-4 mr-1 text-[hsl(var(--muted-foreground))]" />
                          {org._count.members} / {org.maxSeats || '∞'}
                        </div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {org._count.groups} groups
                        </div>
                      </DataTableCell>
                      <DataTableCell className="text-sm text-[hsl(var(--foreground))]">
                        {org.plan}
                      </DataTableCell>
                      <DataTableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </DataTableCell>
                      <DataTableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingOrg(org)
                          }}
                          title="Edit organisation"
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
            <Input
              label="Name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              label="Email Domain"
              type="text"
              value={formData.emailDomain}
              onChange={(e) => setFormData({ ...formData, emailDomain: e.target.value })}
              placeholder="example.com"
            />

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="TRIALING">Trial</option>
              <option value="ACTIVE">Active</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </Select>

            <Select
              label="Plan"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="ORG_MONTHLY">Organisation Monthly</option>
              <option value="ORG_ANNUAL">Organisation Annual</option>
            </Select>

            <Input
              label="Max Seats"
              type="number"
              value={formData.maxSeats}
              onChange={(e) => setFormData({ ...formData, maxSeats: e.target.value })}
              min="0"
            />

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

