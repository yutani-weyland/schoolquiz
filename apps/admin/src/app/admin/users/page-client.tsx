'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Filter, Building2, Trophy, BookOpen, Edit2, X, KeyRound, ChevronLeft, ChevronRight, Download, Trash2, CheckSquare, Square, MoreVertical, Plus, Trash2 as TrashIcon, ChevronDown, FileText, Key, Ban, CheckCircle, Crown, UserCog, Copy, Eye } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { PageHeader, Card, DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell, DataTableEmpty, Badge, Button, StatusStrip, TableSkeleton, Input, Select as AdminSelect } from '@/components/admin/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AutocompleteSearch } from '@/components/admin/AutocompleteSearch'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/lib/dateUtils'
import { getUserTierBadge, getMemberStatusBadge } from '@/lib/statusBadge'
import { downloadCSV, downloadExcel } from '@/lib/exportUtils'

interface User {
  id: string
  name?: string | null
  email: string
  tier: string
  subscriptionStatus: string
  _count: {
    organisations: number
    quizCompletions?: number
    achievements?: number
  }
  lastLoginAt?: string | null
  createdAt: string
}

interface UsersClientProps {
  initialUsers?: User[]
  initialPagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  initialSearchParams?: {
    search: string
    tier: string
    page: number
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
}

export default function UsersClient({
  initialUsers = [],
  initialPagination,
  initialSearchParams,
}: UsersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isLoading, setIsLoading] = useState(false) // Start with false since we have initial data
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Get initial values from URL params or props
  const [searchInput, setSearchInput] = useState(initialSearchParams?.search || searchParams.get('search') || '')
  const debouncedSearch = useDebounce(searchInput, 300)
  const [tierFilter, setTierFilter] = useState(initialSearchParams?.tier || searchParams.get('tier') || '')
  const [page, setPage] = useState(initialSearchParams?.page || parseInt(searchParams.get('page') || '1', 10))
  const [sortBy, setSortBy] = useState<string>(initialSearchParams?.sortBy || searchParams.get('sortBy') || 'createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSearchParams?.sortOrder || (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [pagination, setPagination] = useState(initialPagination || {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (tierFilter) params.set('tier', tierFilter)
    if (page > 1) params.set('page', page.toString())
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder)

    // Update URL without scrolling
    router.push(`?${params.toString()}`, { scroll: false })

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-users-filters', JSON.stringify({
        search: debouncedSearch,
        tier: tierFilter,
        page,
        sortBy,
        sortOrder,
      }))
    }
  }, [debouncedSearch, tierFilter, page, sortBy, sortOrder, router])

  // Update search query when debounced value changes
  useEffect(() => {
    setPage(1) // Reset to first page on search
  }, [debouncedSearch])

  // Only fetch if params changed from initial (client-side navigation/filtering)
  useEffect(() => {
    const paramsChanged = 
      debouncedSearch !== (initialSearchParams?.search || '') ||
      tierFilter !== (initialSearchParams?.tier || '') ||
      page !== (initialSearchParams?.page || 1) ||
      sortBy !== (initialSearchParams?.sortBy || 'createdAt') ||
      sortOrder !== (initialSearchParams?.sortOrder || 'desc')
    
    if (paramsChanged) {
      fetchUsers()
    }
  }, [debouncedSearch, tierFilter, page, sortBy, sortOrder])

  const fetchUsers = async () => {
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
      if (tierFilter) params.append('tier', tierFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users || [])
        setPagination(data.pagination || pagination)
      } else {
        throw new Error(data.error || 'Failed to fetch users')
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      setError(error.message || 'Failed to load users. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSearchSuggestions = async (query: string): Promise<string[]> => {
    if (query.length < 2) return []

    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()

      if (response.ok && data.users) {
        // Return user names and emails as suggestions
        return data.users
          .map((user: User) => [
            user.name || user.email,
            user.email,
          ])
          .flat()
          .filter((s: string | null | undefined): s is string => Boolean(s))
          .filter((s: string, i: number, arr: string[]) => arr.indexOf(s) === i) // Remove duplicates
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
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(users.map(user => user.id)))
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} user(s)? This action cannot be undone.`)) {
      return
    }

    setIsBulkActionLoading(true)
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          ids: Array.from(selectedIds),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete users')
      }

      if (result.errors && result.errors.length > 0) {
        setError(`Some users failed to delete: ${result.errors.join(', ')}`)
      }

      clearSelection()
      await fetchUsers()
    } catch (error: any) {
      setError(error.message || 'Failed to delete users')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: string, data?: any) => {
    try {
      setActionLoading(userId)
      setError(null)

      if (action === 'delete') {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Failed to delete user')
        }
        await fetchUsers()
        return
      }

      if (action === 'changeRole') {
        const newRole = prompt('Enter new platform role (PLATFORM_ADMIN, ORG_ADMIN, TEACHER, STUDENT, PARENT, or leave empty to remove):')
        if (newRole === null) return
        data = { platformRole: newRole || null }
      }

      const response = await fetch(`/api/admin/users/${userId}/actions`, {
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

      // Refresh user data
      await fetchUsers()
    } catch (error: any) {
      setError(error.message || 'Failed to perform action')
      alert(error.message || 'Failed to perform action')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkTierUpdate = async (newTier: string) => {
    if (!confirm(`Update ${selectedIds.size} user(s) to ${newTier} tier?`)) {
      return
    }

    setIsBulkActionLoading(true)
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateTier',
          ids: Array.from(selectedIds),
          data: { tier: newTier },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update users')
      }

      if (result.errors && result.errors.length > 0) {
        setError(`Some users failed to update: ${result.errors.join(', ')}`)
      }

      clearSelection()
      await fetchUsers()
    } catch (error: any) {
      setError(error.message || 'Failed to update users')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  // Export functionality
  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    const columns = [
      { key: 'name' as const, label: 'Name' },
      { key: 'email' as const, label: 'Email' },
      { key: 'tier' as const, label: 'Tier' },
      { key: 'subscriptionStatus' as const, label: 'Subscription Status' },
      { key: 'organisationCount' as const, label: 'Organisations' },
      { key: 'quizCompletions' as const, label: 'Quiz Completions' },
      { key: 'achievements' as const, label: 'Achievements' },
      { key: 'lastLogin' as const, label: 'Last Login' },
      { key: 'createdAt' as const, label: 'Joined' },
    ]

    const exportData = users.map(user => ({
      name: user.name || '',
      email: user.email,
      tier: user.tier,
      subscriptionStatus: user.subscriptionStatus,
      organisationCount: user._count?.organisations || 0,
      quizCompletions: user._count.quizCompletions,
      achievements: user._count.achievements,
      lastLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never',
      createdAt: new Date(user.createdAt).toLocaleString(),
    }))

    if (format === 'csv') {
      downloadCSV(exportData, columns, `users-${new Date().toISOString().split('T')[0]}`)
    } else if (format === 'excel') {
      downloadExcel(exportData, columns, `users-${new Date().toISOString().split('T')[0]}`)
    } else if (format === 'json') {
      const jsonStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-${new Date().toISOString().split('T')[0]}.json`
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
      {/* Actions bar */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span className="hidden lg:inline">Create User</span>
        </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={users.length === 0 || isLoading}
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
          message="Failed to load users"
          details={error}
          action={{
            label: 'Retry',
            onClick: fetchUsers,
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
                    Update Tier
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'basic', label: 'Basic', variant: 'default' as const },
                      { value: 'premium', label: 'Premium', variant: 'info' as const },
                    ].map((tier) => (
                      <Button
                        key={tier.value}
                        variant="secondary"
                        size="sm"
                        onClick={() => handleBulkTierUpdate(tier.value)}
                        disabled={isBulkActionLoading}
                        className="w-full justify-start gap-2 text-xs h-9 hover:bg-[hsl(var(--muted))]"
                      >
                        <Badge variant={tier.variant} className="text-xs px-2 py-0.5">
                          {tier.label}
                        </Badge>
                        <span className="text-[hsl(var(--muted-foreground))]">Set to {tier.label}</span>
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
              placeholder="Search users..."
              onFetchSuggestions={fetchSearchSuggestions}
              className="text-xs"
              minChars={2}
              maxSuggestions={8}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
            <Select
              value={tierFilter || "all"}
              onValueChange={(value) => {
                setTierFilter(value === "all" ? "" : value)
                setPage(1)
              }}
            >
              <SelectTrigger className="pl-10 text-xs">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
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
                      <DataTableHeaderCell className="w-12">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSelectAll()
                          }}
                          className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${selectedIds.size === users.length && users.length > 0
                            ? 'bg-[hsl(var(--primary))]/10 hover:bg-[hsl(var(--primary))]/20'
                            : 'hover:bg-[hsl(var(--muted))]'
                            }`}
                          title={selectedIds.size === users.length ? 'Deselect all' : 'Select all'}
                        >
                          {selectedIds.size === users.length && users.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-[hsl(var(--primary))]" />
                          ) : (
                            <Square className="w-5 h-5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" />
                          )}
                        </button>
                      </DataTableHeaderCell>
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
                    {users.map((user) => {
                      const isSelected = selectedIds.has(user.id)
                      const tierConfig = getUserTierBadge(user.tier)
                      return (
                        <DataTableRow
                          key={user.id}
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className={isSelected ? 'bg-[hsl(var(--primary))]/5' : ''}
                        >
                          <DataTableCell>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSelect(user.id)
                              }}
                              className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${isSelected
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
                              <div>
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
                            <Badge variant={tierConfig.variant}>
                              {tierConfig.label}
                            </Badge>
                          </DataTableCell>
                          <DataTableCell>
                            <div className="flex items-center text-sm text-[hsl(var(--foreground))]">
                              <Building2 className="w-4 h-4 mr-1 text-[hsl(var(--muted-foreground))]" />
                              {user._count?.organisations || 0}
                            </div>
                          </DataTableCell>
                          <DataTableCell>
                            <div className="flex items-center gap-4 text-sm text-[hsl(var(--foreground))]">
                              <div className="flex items-center">
                                <BookOpen className="w-4 h-4 mr-1 text-[hsl(var(--muted-foreground))]" />
                                {user._count?.quizCompletions || 0}
                              </div>
                              <div className="flex items-center">
                                <Trophy className="w-4 h-4 mr-1 text-[hsl(var(--muted-foreground))]" />
                                {user._count?.achievements || 0}
                              </div>
                            </div>
                          </DataTableCell>
                          <DataTableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                            <span title={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false,
                            }) : 'Never'}>
                              {formatDate(user.lastLoginAt)}
                            </span>
                          </DataTableCell>
                          <DataTableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                            <span title={new Date(user.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false,
                            })}>
                              {formatDate(user.createdAt)}
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
                                  disabled={actionLoading === user.id}
                                >
                                  {actionLoading === user.id ? (
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
                                      router.push(`/admin/users/${user.id}`)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors text-left"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUserAction(user.id, 'resetPassword')
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors text-left"
                                  >
                                    <Key className="w-4 h-4" />
                                    Reset Password
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUserAction(user.id, 'generateReferralCode')
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors text-left"
                                  >
                                    <Copy className="w-4 h-4" />
                                    Generate Referral Code
                                  </button>
                                  <div className="border-t border-[hsl(var(--border))] my-1" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUserAction(user.id, user.subscriptionStatus === 'CANCELLED' ? 'activate' : 'suspend')
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors text-left"
                                  >
                                    {user.subscriptionStatus === 'CANCELLED' ? (
                                      <>
                                        <CheckCircle className="w-4 h-4" />
                                        Activate Account
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="w-4 h-4" />
                                        Suspend Account
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUserAction(user.id, 'changeTier', { tier: user.tier === 'premium' ? 'basic' : 'premium' })
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors text-left"
                                  >
                                    <Crown className="w-4 h-4" />
                                    {user.tier === 'premium' ? 'Downgrade to Basic' : 'Upgrade to Premium'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUserAction(user.id, 'changeRole')
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors text-left"
                                  >
                                    <UserCog className="w-4 h-4" />
                                    Change Platform Role
                                  </button>
                                  <div className="border-t border-[hsl(var(--border))] my-1" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm(`Are you sure you want to delete ${user.name || user.email}? This action cannot be undone.`)) {
                                        handleUserAction(user.id, 'delete')
                                      }
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 rounded-lg transition-colors text-left"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete User
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

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSave={async () => {
              setShowCreateModal(false)
              await fetchUsers()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CreateUserModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    tier: 'basic',
    platformRole: '',
    subscriptionStatus: 'FREE_TRIAL',
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
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          platformRole: formData.platformRole || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      setSuccess('User created successfully')
      setTimeout(() => {
        onSave()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to create user')
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
            <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Create User</h2>
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
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <AdminSelect
              label="Tier"
              value={formData.tier}
              onChange={(e: any) => setFormData({ ...formData, tier: e.target.value })}
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </AdminSelect>

            <AdminSelect
              label="Platform Role"
              value={formData.platformRole}
              onChange={(e: any) => setFormData({ ...formData, platformRole: e.target.value })}
            >
              <option value="">None</option>
              <option value="PLATFORM_ADMIN">Platform Admin</option>
              <option value="ORG_ADMIN">Organisation Admin</option>
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
              <option value="PARENT">Parent</option>
            </AdminSelect>

            <AdminSelect
              label="Subscription Status"
              value={formData.subscriptionStatus}
              onChange={(e: any) => setFormData({ ...formData, subscriptionStatus: e.target.value })}
            >
              <option value="FREE_TRIAL">Free Trial</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </AdminSelect>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400">
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
                  'Create User'
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
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
  const [userOrganisations, setUserOrganisations] = useState<Array<{ id: string; name: string; role: string; status: string }>>([])
  const [allOrganisations, setAllOrganisations] = useState<Array<{ id: string; name: string }>>([])
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false)
  const [isManagingOrgs, setIsManagingOrgs] = useState(false)

  // Fetch user's organizations and all organizations
  useEffect(() => {
    fetchUserOrganisations()
    fetchAllOrganisations()
  }, [user.id])

  const fetchUserOrganisations = async () => {
    try {
      setIsLoadingOrgs(true)
      const response = await fetch(`/api/admin/users/${user.id}`)
      const data = await response.json()
      if (response.ok && data.user?.organisations) {
        setUserOrganisations(data.user.organisations)
      }
    } catch (err) {
      console.error('Failed to fetch user organisations:', err)
    } finally {
      setIsLoadingOrgs(false)
    }
  }

  const fetchAllOrganisations = async () => {
    try {
      const response = await fetch('/api/admin/organisations?limit=1000')
      const data = await response.json()
      if (response.ok && data.organisations) {
        setAllOrganisations(data.organisations.map((org: { id: string; name: string }) => ({ id: org.id, name: org.name })))
      }
    } catch (err) {
      console.error('Failed to fetch organisations:', err)
    }
  }

  const handleAddOrganisation = async () => {
    if (!selectedOrgId) return

    setIsManagingOrgs(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/organisations/${selectedOrgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role: 'MEMBER' }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add user to organisation')
      }

      setSuccess('User added to organisation successfully')
      await fetchUserOrganisations()
      setSelectedOrgId('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to add user to organisation')
    } finally {
      setIsManagingOrgs(false)
    }
  }

  const handleRemoveOrganisation = async (orgId: string) => {
    if (!confirm('Are you sure you want to remove this user from the organisation?')) {
      return
    }

    setIsManagingOrgs(true)
    setError('')
    try {
      // First, get the member ID
      const orgResponse = await fetch(`/api/admin/organisations/${orgId}`)
      const orgData = await orgResponse.json()
      if (!orgResponse.ok) throw new Error('Failed to fetch organisation')

      const member = orgData.organisation?.members?.find((m: any) => m.userId === user.id)
      if (!member) {
        throw new Error('User is not a member of this organisation')
      }

      const response = await fetch(`/api/admin/organisations/${orgId}/members/${member.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove user from organisation')
      }

      setSuccess('User removed from organisation successfully')
      await fetchUserOrganisations()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to remove user from organisation')
    } finally {
      setIsManagingOrgs(false)
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading && !isResettingPassword && !isManagingOrgs) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, isLoading, isResettingPassword, isManagingOrgs])

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
      }, 3000) // Keep success message visible for 3 seconds
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
      setTimeout(() => {
        setSuccess('')
      }, 3000) // Keep success message visible for 3 seconds
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
          className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl border border-[hsl(var(--border))] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Edit User</h2>
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
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <AdminSelect
              label="Tier"
              value={formData.tier}
              onChange={(e: any) => setFormData({ ...formData, tier: e.target.value })}
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </AdminSelect>

            <AdminSelect
              label="Subscription Status"
              value={formData.subscriptionStatus}
              onChange={(e: any) => setFormData({ ...formData, subscriptionStatus: e.target.value })}
            >
              <option value="FREE_TRIAL">Free Trial</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </AdminSelect>

            {/* Organisations Section */}
            <div className="pt-4 border-t border-[hsl(var(--border))]">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-[hsl(var(--foreground))]">
                  Organisations ({userOrganisations.length})
                </label>
              </div>

              {/* Current Organisations */}
              {isLoadingOrgs ? (
                <div className="text-sm text-[hsl(var(--muted-foreground))] py-2">Loading organisations...</div>
              ) : userOrganisations.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {userOrganisations.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-3 bg-[hsl(var(--muted))] rounded-lg border border-[hsl(var(--border))]"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[hsl(var(--foreground))]">{org.name}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                          Role: {org.role} • Status: {org.status}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveOrganisation(org.id)}
                        disabled={isManagingOrgs}
                        className="p-1.5 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove from organisation"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[hsl(var(--muted-foreground))] py-2 mb-4">
                  No organisations assigned
                </div>
              )}

              {/* Add Organisation */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <AdminSelect
                    label="Add to Organisation"
                    value={selectedOrgId}
                    onChange={(e: any) => setSelectedOrgId(e.target.value)}
                  >
                    <option value="">Select an organisation...</option>
                    {allOrganisations
                      .filter(org => !userOrganisations.some(uo => uo.id === org.id))
                      .map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                  </AdminSelect>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddOrganisation}
                  disabled={!selectedOrgId || isManagingOrgs}
                  className="mb-0"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
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

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
              <Button
                type="button"
                variant="secondary"
                onClick={handleResetPassword}
                disabled={isResettingPassword}
              >
                {isResettingPassword ? (
                  <Spinner className="size-4 mr-2" />
                ) : (
                  <KeyRound className="w-4 h-4 mr-2" />
                )}
                {isResettingPassword ? 'Sending...' : 'Reset Password'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading || isResettingPassword}
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

