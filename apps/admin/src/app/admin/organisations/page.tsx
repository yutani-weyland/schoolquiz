'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Search, Filter, Users, Calendar, Edit2, X, ChevronLeft, ChevronRight, Download, Trash2, CheckSquare, Square, MoreVertical, ChevronDown, FileText, Eye, Ban, CheckCircle, CreditCard, UserPlus, Plus } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { PageHeader, Card, DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell, DataTableEmpty, Badge, Button, StatusStrip } from '@/components/admin/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AutocompleteSearch } from '@/components/admin/AutocompleteSearch'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useDebounce } from '@/hooks/useDebounce'
import { TableSkeleton } from '@/components/admin/ui/TableSkeleton'
import { formatDate } from '@/lib/dateUtils'
import { getOrganisationStatusBadge } from '@/lib/statusBadge'
import { downloadCSV, downloadExcel } from '@/lib/exportUtils'

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
  const searchParams = useSearchParams()
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Get initial values from URL params
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc')
  const [editingOrg, setEditingOrg] = useState<Organisation | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (statusFilter) params.set('status', statusFilter)
    if (page > 1) params.set('page', page.toString())
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder)
    
    // Update URL without scrolling
    router.push(`?${params.toString()}`, { scroll: false })
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-organisations-filters', JSON.stringify({
        search: debouncedSearch,
        status: statusFilter,
        page,
        sortBy,
        sortOrder,
      }))
    }
  }, [debouncedSearch, statusFilter, page, sortBy, sortOrder, router])

  // Update search query when debounced value changes
  useEffect(() => {
    setPage(1) // Reset to first page on search
  }, [debouncedSearch])

  useEffect(() => {
    fetchOrganisations()
  }, [debouncedSearch, statusFilter, page, sortBy, sortOrder])

  const fetchOrganisations = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sortBy,
        sortOrder,
      })
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/admin/organisations?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setOrganisations(data.organisations || [])
        setPagination(data.pagination || pagination)
      } else {
        throw new Error(data.error || 'Failed to fetch organisations')
      }
    } catch (error: any) {
      console.error('Failed to fetch organisations:', error)
      setError(error.message || 'Failed to load organisations. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSearchSuggestions = async (query: string): Promise<string[]> => {
    if (query.length < 2) return []
    
    try {
      const response = await fetch(`/api/admin/organisations?search=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()
      
      if (response.ok && data.organisations) {
        return data.organisations
          .map((org: Organisation) => [
            org.name,
            org.emailDomain,
          ])
          .flat()
          .filter((s: string | null | undefined): s is string => Boolean(s))
          .filter((s, i, arr) => arr.indexOf(s) === i)
          .slice(0, 10)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }
    
    return []
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

  // Bulk selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === organisations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(organisations.map(org => org.id)))
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} organisation(s)? This action cannot be undone.`)) {
      return
    }

    setIsBulkActionLoading(true)
    try {
      const response = await fetch('/api/admin/organisations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          ids: Array.from(selectedIds),
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete organisations')
      }

      if (result.errors && result.errors.length > 0) {
        setError(`Some organisations failed to delete: ${result.errors.join(', ')}`)
      }

      clearSelection()
      await fetchOrganisations()
    } catch (error: any) {
      setError(error.message || 'Failed to delete organisations')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const handleOrgAction = async (orgId: string, action: string, data?: any) => {
    try {
      setActionLoading(orgId)
      setError(null)

      if (action === 'delete') {
        const response = await fetch(`/api/admin/organisations/${orgId}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Failed to delete organisation')
        }
        await fetchOrganisations()
        return
      }

      if (action === 'changePlan') {
        const newPlan = prompt('Enter new plan (INDIVIDUAL, ORG_MONTHLY, ORG_ANNUAL):')
        if (!newPlan) return
        data = { plan: newPlan }
      }

      if (action === 'changeMaxSeats') {
        const newMaxSeats = prompt('Enter new max seats (number):')
        if (!newMaxSeats) return
        const seats = parseInt(newMaxSeats, 10)
        if (isNaN(seats) || seats < 0) {
          alert('Invalid number of seats')
          return
        }
        data = { maxSeats: seats }
      }

      if (action === 'transferOwnership') {
        const newOwnerId = prompt('Enter new owner user ID:')
        if (!newOwnerId) return
        data = { newOwnerId }
      }

      const response = await fetch(`/api/admin/organisations/${orgId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to perform action')
      }

      // Show success message
      alert(result.message || 'Action completed successfully')
      
      // Refresh organisation data
      await fetchOrganisations()
    } catch (error: any) {
      setError(error.message || 'Failed to perform action')
      alert(error.message || 'Failed to perform action')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (!confirm(`Update ${selectedIds.size} organisation(s) to ${newStatus}?`)) {
      return
    }

    setIsBulkActionLoading(true)
    try {
      const response = await fetch('/api/admin/organisations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          ids: Array.from(selectedIds),
          data: { status: newStatus },
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update organisations')
      }

      if (result.errors && result.errors.length > 0) {
        setError(`Some organisations failed to update: ${result.errors.join(', ')}`)
      }

      clearSelection()
      await fetchOrganisations()
    } catch (error: any) {
      setError(error.message || 'Failed to update organisations')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  // Export functionality
  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    const columns = [
      { key: 'name' as const, label: 'Organisation' },
      { key: 'emailDomain' as const, label: 'Email Domain' },
      { key: 'status' as const, label: 'Status' },
      { key: 'plan' as const, label: 'Plan' },
      { key: 'maxSeats' as const, label: 'Max Seats' },
      { key: 'ownerEmail' as const, label: 'Owner Email' },
      { key: 'memberCount' as const, label: 'Members' },
      { key: 'groupCount' as const, label: 'Groups' },
      { key: 'createdAt' as const, label: 'Created' },
    ]

    const exportData = organisations.map(org => ({
      name: org.name,
      emailDomain: org.emailDomain || '',
      status: org.status,
      plan: org.plan,
      maxSeats: org.maxSeats,
      ownerEmail: org.owner.email,
      memberCount: org._count.members,
      groupCount: org._count.groups,
      createdAt: new Date(org.createdAt).toLocaleString(),
    }))

    if (format === 'csv') {
      downloadCSV(exportData, columns, `organisations-${new Date().toISOString().split('T')[0]}`)
    } else if (format === 'excel') {
      downloadExcel(exportData, columns, `organisations-${new Date().toISOString().split('T')[0]}`)
    } else if (format === 'json') {
      const jsonStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `organisations-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const totalPages = pagination.totalPages
    const currentPage = pagination.page

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className={`space-y-6 ${selectedIds.size > 0 ? 'pr-80' : ''} transition-all duration-300`}>
      <PageHeader
        title="Organisations"
        description="Manage organisations and their members"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden lg:inline">Create Organisation</span>
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={organisations.length === 0 || isLoading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2" align="end">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors text-left"
                >
                  <FileText className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors text-left"
                >
                  <FileText className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors text-left"
                >
                  <FileText className="w-4 h-4" />
                  JSON
                </button>
              </PopoverContent>
            </Popover>
          </div>
        }
      />

      {/* Error State */}
      {error && (
        <StatusStrip
          variant="error"
          message="Failed to load organisations"
          details={error}
          action={{
            label: 'Retry',
            onClick: fetchOrganisations,
          }}
        />
      )}

      {/* Slide-out Bulk Actions Panel */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-[60] w-80 bg-[hsl(var(--card))] border-l border-[hsl(var(--border))] flex flex-col"
            >
            {/* Header - matches sidebar header style */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] h-[60px]">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-pulse flex-shrink-0" />
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] whitespace-nowrap">
                  Bulk Actions
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="p-2 rounded-xl hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-all duration-200 flex-shrink-0"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Selection count */}
            <div className="px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
              <div className="px-3 py-1.5 bg-[hsl(var(--primary))]/10 rounded-lg border border-[hsl(var(--primary))]/20 inline-block">
                <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                  {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-3 uppercase tracking-wide">
                  Update Status
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'ACTIVE', label: 'Active', variant: 'success' as const },
                    { value: 'TRIALING', label: 'Trialing', variant: 'info' as const },
                    { value: 'PAST_DUE', label: 'Past Due', variant: 'warning' as const },
                    { value: 'CANCELLED', label: 'Cancelled', variant: 'default' as const },
                    { value: 'EXPIRED', label: 'Expired', variant: 'error' as const },
                  ].map((status) => (
                    <Button
                      key={status.value}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate(status.value)}
                      disabled={isBulkActionLoading}
                      className="w-full justify-start gap-2 text-xs h-9 hover:bg-[hsl(var(--muted))]"
                    >
                      <Badge variant={status.variant} className="text-xs px-2 py-0.5">
                        {status.label}
                      </Badge>
                      <span className="text-[hsl(var(--muted-foreground))]">Set to {status.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[hsl(var(--border))]">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isBulkActionLoading}
                  className="w-full gap-2 text-xs h-9"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'}
                </Button>
              </div>
            </div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <AutocompleteSearch
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search organisations..."
              onFetchSuggestions={fetchSearchSuggestions}
              className="text-xs"
              minChars={2}
              maxSuggestions={8}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => {
                setStatusFilter(value === "all" ? "" : value)
                setPage(1)
              }}
            >
              <SelectTrigger className="pl-10 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="TRIALING">Trial</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAST_DUE">Past Due</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={7} />
      ) : (
      <DataTable
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
                      <DataTableHeaderCell className="w-12">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSelectAll()
                          }}
                          className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                            selectedIds.size === organisations.length && organisations.length > 0
                              ? 'bg-[hsl(var(--primary))]/10 hover:bg-[hsl(var(--primary))]/20' 
                              : 'hover:bg-[hsl(var(--muted))]'
                          }`}
                          title={selectedIds.size === organisations.length ? 'Deselect all' : 'Select all'}
                        >
                          {selectedIds.size === organisations.length && organisations.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-[hsl(var(--primary))]" />
                          ) : (
                            <Square className="w-5 h-5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" />
                          )}
                        </button>
                      </DataTableHeaderCell>
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
                    {organisations.map((org) => {
                      const isSelected = selectedIds.has(org.id)
                      const statusConfig = getOrganisationStatusBadge(org.status)
                      return (
                        <DataTableRow 
                          key={org.id}
                          onClick={() => router.push(`/admin/organisations/${org.id}`)}
                          className={isSelected ? 'bg-[hsl(var(--primary))]/5' : ''}
                        >
                          <DataTableCell>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSelect(org.id)
                              }}
                              className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                                isSelected 
                                  ? 'bg-[hsl(var(--primary))]/10 hover:bg-[hsl(var(--primary))]/20' 
                                  : 'hover:bg-[hsl(var(--muted))]'
                              }`}
                              title={isSelected ? 'Deselect' : 'Select'}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-[hsl(var(--primary))]" />
                              ) : (
                                <Square className="w-5 h-5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" />
                              )}
                            </button>
                          </DataTableCell>
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
                            <Badge variant={statusConfig.variant}>
                              {statusConfig.label}
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
                            <span title={new Date(org.createdAt).toLocaleString()}>
                              {formatDate(org.createdAt)}
                            </span>
                      </DataTableCell>
                      <DataTableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              title="Actions"
                              disabled={actionLoading === org.id}
                            >
                              {actionLoading === org.id ? (
                                <Spinner className="size-4" />
                              ) : (
                                <MoreVertical className="w-4 h-4" />
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2" align="end" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/admin/organisations/${org.id}`)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors text-left"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <div className="border-t border-[hsl(var(--border))] my-1" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOrgAction(org.id, org.status === 'CANCELLED' ? 'activate' : 'suspend')
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors text-left"
                              >
                                {org.status === 'CANCELLED' ? (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    Activate Organisation
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-4 h-4" />
                                    Suspend Organisation
                                  </>
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOrgAction(org.id, 'changePlan')
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors text-left"
                              >
                                <CreditCard className="w-4 h-4" />
                                Change Plan
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOrgAction(org.id, 'changeMaxSeats')
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors text-left"
                              >
                                <UserPlus className="w-4 h-4" />
                                Change Max Seats
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOrgAction(org.id, 'transferOwnership')
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors text-left"
                              >
                                <Users className="w-4 h-4" />
                                Transfer Ownership
                              </button>
                              <div className="border-t border-[hsl(var(--border))] my-1" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (confirm(`Are you sure you want to delete ${org.name}? This action cannot be undone.`)) {
                                    handleOrgAction(org.id, 'delete')
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 rounded-lg transition-colors text-left"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Organisation
                              </button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </DataTableCell>
                    </DataTableRow>
                      )
                    })}
                </DataTableBody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-[hsl(var(--border))] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[hsl(var(--muted))]">
                <div className="text-sm text-[hsl(var(--foreground))]">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={pagination.page === 1}
                    title="First page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <ChevronLeft className="w-4 h-4 -ml-2" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((pageNum, idx) => (
                      pageNum === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-[hsl(var(--muted-foreground))]">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "primary" : "ghost"}
                          size="sm"
                          onClick={() => setPage(pageNum as number)}
                          className="min-w-[2.5rem]"
                        >
                          {pageNum}
                        </Button>
                      )
                    ))}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page === pagination.totalPages}
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(pagination.totalPages)}
                    disabled={pagination.page === pagination.totalPages}
                    title="Last page"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <ChevronRight className="w-4 h-4 -ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DataTable>
      )}

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

      {/* Create Organisation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateOrganisationModal
            onClose={() => setShowCreateModal(false)}
            onSave={async () => {
              setShowCreateModal(false)
              await fetchOrganisations()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CreateOrganisationModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    emailDomain: '',
    ownerUserId: '',
    maxSeats: '0',
    plan: 'INDIVIDUAL',
    status: 'TRIALING',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [allUsers, setAllUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([])

  // Fetch all users for owner selection
  useEffect(() => {
    fetchAllUsers()
  }, [])

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=1000')
      const data = await response.json()
      if (response.ok && data.users) {
        setAllUsers(data.users.map((user: { id: string; name: string | null; email: string }) => ({
          id: user.id,
          name: user.name,
          email: user.email,
        })))
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/organisations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxSeats: parseInt(formData.maxSeats) || 0,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create organisation')
      }

      setSuccess('Organisation created successfully')
      setTimeout(() => {
        onSave()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to create organisation')
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
            <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Create Organisation</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
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
              placeholder="e.g., example.com (without @)"
            />

            <Select
              label="Owner"
              value={formData.ownerUserId}
              onChange={(e) => setFormData({ ...formData, ownerUserId: e.target.value })}
              required
            >
              <option value="">Select an owner</option>
              {allUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email} ({user.email})
                </option>
              ))}
            </Select>

            <Input
              label="Max Seats"
              type="number"
              value={formData.maxSeats}
              onChange={(e) => setFormData({ ...formData, maxSeats: e.target.value })}
              min="0"
            />

            <Select
              label="Plan"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="ORG_MONTHLY">Organisation Monthly</option>
              <option value="ORG_ANNUAL">Organisation Annual</option>
            </Select>

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="TRIALING">Trialing</option>
              <option value="ACTIVE">Active</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
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

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner className="size-4 mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Organisation'
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, isLoading])

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
      }, 3000) // Keep success message visible for 3 seconds
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
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
              placeholder="Maximum number of members (seats)"
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

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
              >
                {isLoading && <Spinner className="size-4 mr-2" />}
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

