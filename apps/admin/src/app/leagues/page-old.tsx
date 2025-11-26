'use client'

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useVirtualizer } from '@tanstack/react-virtual'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Trophy, Users, Plus, Search, X, Copy, Mail, Calendar, Edit2, Trash2, LogOut, UserX, AlertCircle, RefreshCw, Building2, CheckCircle, XCircle, Loader2, KeyRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useUserTier } from '@/hooks/useUserTier'
import { useUserAccess } from '@/contexts/UserAccessContext'
import { UpgradeModal } from '@/components/premium/UpgradeModal'
import { SiteHeader } from '@/components/SiteHeader'
import { Footer } from '@/components/Footer'
import { fetchLeagues, fetchLeagueStats, fetchLeagueDetails, getCachedLeagues, cacheLeagues, type League, type LeagueStats, fetchAvailableOrgLeagues, fetchLeagueRequests, respondToRequest, type OrganisationLeague, type LeagueRequest } from '@/lib/leagues-fetch'
import { LeaguesListSkeleton, LeagueDetailsSkeleton } from '@/components/leagues/LeaguesSkeleton'
import { OrganisationLeaguesSection } from '@/components/leagues/OrganisationLeaguesSection'

// Dynamic import for DnD Kit components - loads only when needed (saves ~100KB)
const DraggableLeaguesList = dynamic(() => import('./DraggableLeaguesList').then(mod => ({ default: mod.DraggableLeaguesList })), {
  loading: () => <LeaguesListSkeleton />,
  ssr: false, // DnD Kit doesn't work with SSR
})


export default function LeaguesPage() {
  const { tier, isPremium, isLoading: tierLoading } = useUserTier()
  const { userName } = useUserAccess()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showKickModal, setShowKickModal] = useState(false)
  const [showRequestsModal, setShowRequestsModal] = useState(false)
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false)
  const [memberToKick, setMemberToKick] = useState<{ id: string; name: string } | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSearch, setInviteSearch] = useState('')
  const debouncedInviteSearch = useDebounce(inviteSearch, 200) // Debounce search input
  const [orgMembers, setOrgMembers] = useState<any[]>([])
  const [loadingOrgMembers, setLoadingOrgMembers] = useState(false)
  const [inviteMode, setInviteMode] = useState<'org' | 'external' | 'code'>('org')
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [leagueColor, setLeagueColor] = useState('#3B82F6')
  const [inviting, setInviting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [kicking, setKicking] = useState(false)

  // Check if user has access (premium or admin)
  // Note: platformRole should come from NextAuth session, but for now we check localStorage as fallback
  // TODO: Update to use session.user.platformRole from NextAuth
  const platformRole = typeof window !== 'undefined' ? localStorage.getItem('platformRole') : null
  const isAdmin = platformRole === 'PLATFORM_ADMIN' || platformRole === 'ORG_ADMIN'
  const hasAccess = isPremium || isAdmin

  // Get cached leagues for instant initial render
  const cachedLeagues = useMemo(() => getCachedLeagues(), [])

  // Fetch leagues with React Query - enabled only if user has access
  const {
    data: leagues = cachedLeagues || [],
    isLoading: leaguesLoading,
    error: leaguesError,
    refetch: refetchLeagues,
  } = useQuery({
    queryKey: ['private-leagues'],
    queryFn: async () => {
      const data = await fetchLeagues()
      cacheLeagues(data) // Cache for instant next render
      return data
    },
    enabled: hasAccess && !tierLoading,
    staleTime: 30 * 1000, // 30 seconds - leagues don't change often
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2,
    retryDelay: 1000,
    // Use cached data as initial data for instant render
    initialData: cachedLeagues || undefined,
    placeholderData: cachedLeagues || undefined,
  })

  // Fetch full league details (with members) when a league is selected
  const {
    data: selectedLeagueDetails,
    isLoading: selectedLeagueLoading,
  } = useQuery({
    queryKey: ['league-details', selectedLeagueId],
    queryFn: () => fetchLeagueDetails(selectedLeagueId!),
    enabled: !!selectedLeagueId && hasAccess,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
  })

  // Get selected league - prefer full details (with members), fallback to list item
  const selectedLeague = useMemo(() => {
    if (!selectedLeagueId) return null
    // Use full details if available (includes members), otherwise use list item
    if (selectedLeagueDetails) {
      return selectedLeagueDetails
    }
    if (leagues.length) {
      return leagues.find(l => l.id === selectedLeagueId) || null
    }
    return null
  }, [selectedLeagueId, selectedLeagueDetails, leagues])

  // Determine if we should show loading skeleton for details
  // Show skeleton when:
  // 1. League is selected but we're loading details AND don't have them yet
  // 2. We have league details but stats are still loading (only show briefly, not if we have cached stats)
  const isDetailsLoading = useMemo(() => {
    if (!selectedLeagueId) return false

    // If we're loading details for the selected league and don't have them yet
    // Show skeleton only if we don't have even basic league info from the list
    if (selectedLeagueLoading && !selectedLeagueDetails) {
      // If we have the league from the list, show it (even without members)
      // Only show skeleton if we have nothing at all
      if (!selectedLeague) {
        return true
      }
    }

    // Don't show skeleton for stats loading - stats are optional and can load in background
    // The league details are more important
    return false
  }, [selectedLeagueId, selectedLeagueLoading, selectedLeagueDetails, selectedLeague])

  // Determine if leagues list is loading (accounting for cached data)
  // Only show skeleton if we're actually loading AND have no data (cached or fresh)
  const isLeaguesListLoading = leaguesLoading && leagues.length === 0

  // Fetch stats for selected league - enabled only when league is selected
  const {
    data: leagueStats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['league-stats', selectedLeagueId],
    queryFn: () => fetchLeagueStats(selectedLeagueId!),
    enabled: !!selectedLeagueId && hasAccess,
    staleTime: 10 * 1000, // 10 seconds - stats update more frequently
    gcTime: 2 * 60 * 1000, // 2 minutes cache
    retry: 1,
  })

  // Fetch user's organization info
  const { data: userOrg } = useQuery({
    queryKey: ['user-organisation'],
    queryFn: async () => {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      if (!userId) return null

      const response = await fetch('/api/user/organisation', {
        headers: {
          ...(typeof window !== 'undefined' && localStorage.getItem('authToken')
            ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            : {}),
          ...(userId ? { 'X-User-Id': userId } : {}),
        },
      })

      if (!response.ok) return null
      const data = await response.json()
      return data.organisation || null
    },
    enabled: hasAccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch pending requests for leagues user administers
  const { data: leagueRequests = [] } = useQuery({
    queryKey: ['league-requests'],
    queryFn: fetchLeagueRequests,
    enabled: hasAccess,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  })

  // Mutation for responding to requests
  const respondToRequestMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'approve' | 'reject' }) =>
      respondToRequest(requestId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['league-requests'] })
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
    },
  })


  // Auto-select first league when leagues load
  useEffect(() => {
    if (leagues.length > 0 && !selectedLeagueId && !selectedLeague) {
      // Try to restore from localStorage first
      const savedOrder = typeof window !== 'undefined'
        ? localStorage.getItem('league-order')
        : null

      if (savedOrder) {
        try {
          const order = JSON.parse(savedOrder) as string[]
          const firstSaved = order.find(id => leagues.some(l => l.id === id))
          if (firstSaved) {
            setSelectedLeagueId(firstSaved)
            return
          }
        } catch {
          // Invalid saved order, ignore
        }
      }

      // Otherwise select first league
      setSelectedLeagueId(leagues[0].id)
    }
  }, [leagues, selectedLeagueId, selectedLeague])

  // Save league order to localStorage
  const saveLeagueOrder = useCallback((newOrder: League[]) => {
    if (typeof window !== 'undefined') {
      const order = newOrder.map(l => l.id)
      localStorage.setItem('league-order', JSON.stringify(order))
    }
  }, [])

  // Mutation for creating league
  const createLeagueMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; color: string; organisationId?: string }) => {
      const response = await fetch('/api/private-leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send session cookie
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        let error: any = {}
        let errorText = ''
        const contentType = response.headers.get('content-type')

        try {
          // Get response text (can only be called once)
          errorText = await response.text()

          // Try to parse as JSON if content-type suggests it
          if (contentType && contentType.includes('application/json') && errorText) {
            try {
              error = JSON.parse(errorText)
            } catch (e) {
              // If JSON parse fails, use text as error message
              error = { error: errorText || `Server error (${response.status})` }
            }
          } else {
            error = { error: errorText || `Server error (${response.status})` }
          }
        } catch (parseError: any) {
          error = {
            error: `Failed to read error response (${response.status})`,
            parseError: parseError.message,
          }
        }

        const errorMessage = error.error || error.details || error.message || `Failed to create league (${response.status} ${response.statusText})`

        // Log comprehensive error details
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          contentType,
          error: error.error,
          details: error.details,
          code: error.code,
          message: error.message,
          fullError: error,
          rawText: errorText,
        }
        console.error('Create league error:', errorDetails)
        console.error('Full error object:', JSON.stringify(errorDetails, null, 2))

        throw new Error(errorMessage)
      }

      // Parse successful response
      const responseData = await response.json()
      return responseData
    },
    onSuccess: (data) => {
      const newLeague = data.league
      // Optimistically update cache
      queryClient.setQueryData(['private-leagues'], (old: League[] = []) => {
        const updated = [newLeague, ...old]
        cacheLeagues(updated)
        return updated
      })
      setSelectedLeagueId(newLeague.id)
      setShowCreateModal(false)
      setLeagueColor('#3B82F6')
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
      queryClient.invalidateQueries({ queryKey: ['available-org-leagues'] })
    },
  })

  const handleCreateLeague = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)

    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get('name') as string
      const description = formData.get('description') as string

      await createLeagueMutation.mutateAsync({
        name,
        description: description || '',
        color: leagueColor,
        organisationId: userOrg?.id,
      })

      // Reset form if it still exists
      if (e.currentTarget) {
        e.currentTarget.reset()
      }
    } catch (error) {
      console.error('Error creating league:', error)
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : 'Failed to create league'
      alert(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  // Mutation for inviting user
  const inviteUserMutation = useMutation({
    mutationFn: async ({ leagueId, email }: { leagueId: string; email: string }) => {
      const response = await fetch(`/api/private-leagues/${leagueId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('authToken')
            ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            : {}),
          ...(typeof window !== 'undefined' && localStorage.getItem('userId')
            ? { 'X-User-Id': localStorage.getItem('userId')! }
            : {}),
        },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to invite user')
      }
      return response.json()
    },
    onSuccess: () => {
      // Refetch leagues to get updated member list
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
      setInviteEmail('')
      setShowInviteModal(false)
      alert('Successfully invited user!')
    },
  })

  const joinByCodeMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await fetch('/api/private-leagues/join-by-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('authToken')
            ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            : {}),
          ...(typeof window !== 'undefined' && localStorage.getItem('userId')
            ? { 'X-User-Id': localStorage.getItem('userId')! }
            : {}),
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to join league')
      }
      return response.json()
    },
    onSuccess: (data) => {
      // Optimistically update cache
      queryClient.setQueryData(['private-leagues'], (old: League[] = []) => {
        const newLeague = data.league
        // Check if league already exists in cache
        const exists = old.some(l => l.id === newLeague.id)
        if (exists) {
          return old
        }
        const updated = [newLeague, ...old]
        cacheLeagues(updated)
        return updated
      })
      setSelectedLeagueId(data.league.id)
      setShowJoinByCodeModal(false)
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
      queryClient.invalidateQueries({ queryKey: ['available-org-leagues'] })
    },
  })

  const deleteLeagueMutation = useMutation({
    mutationFn: async (leagueId: string) => {
      const response = await fetch(`/api/private-leagues/${leagueId}`, {
        method: 'DELETE',
        headers: {
          ...(typeof window !== 'undefined' && localStorage.getItem('authToken')
            ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            : {}),
          ...(typeof window !== 'undefined' && localStorage.getItem('userId')
            ? { 'X-User-Id': localStorage.getItem('userId')! }
            : {}),
        },
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to delete league')
      }
      return response.json()
    },
    onSuccess: (_, deletedLeagueId) => {
      // Optimistically update cache
      queryClient.setQueryData(['private-leagues'], (old: League[] = []) => {
        const updated = old.filter(league => league.id !== deletedLeagueId)
        cacheLeagues(updated)

        // Select first league if available, otherwise clear selection
        if (updated.length > 0) {
          setSelectedLeagueId(updated[0].id)
        } else {
          setSelectedLeagueId(null)
        }

        return updated
      })

      // Remove stats for deleted league
      queryClient.removeQueries({ queryKey: ['league-stats', deletedLeagueId] })

      setShowDeleteModal(false)
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
      queryClient.invalidateQueries({ queryKey: ['available-org-leagues'] })
    },
  })

  // Fetch organization members when invite modal opens
  useEffect(() => {
    if (showInviteModal && userOrg?.id) {
      setLoadingOrgMembers(true)
      fetch(`/api/organisation/${userOrg.id}/members`, {
        headers: {
          ...(typeof window !== 'undefined' && localStorage.getItem('authToken')
            ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            : {}),
          ...(typeof window !== 'undefined' && localStorage.getItem('userId')
            ? { 'X-User-Id': localStorage.getItem('userId')! }
            : {}),
        },
      })
        .then(async res => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            throw new Error(errorData.error || `Failed to fetch members: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          // Filter out current user and existing league members
          const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
          const existingMemberIds = new Set(selectedLeague?.members.map(m => m.userId) || [])
          const filtered = (data.members || []).filter((m: any) =>
            m.user?.id !== currentUserId &&
            !existingMemberIds.has(m.user?.id) &&
            m.status === 'ACTIVE'
          )
          setOrgMembers(filtered)
        })
        .catch(err => {
          console.error('[Invite Modal] Error fetching org members:', err)
          alert(`Failed to load organization members: ${err.message}`)
          setOrgMembers([])
        })
        .finally(() => setLoadingOrgMembers(false))
    } else if (showInviteModal && !userOrg) {
      // No org, default to external mode
      setInviteMode('external')
    }
  }, [showInviteModal, userOrg?.id, selectedLeague?.members])

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedLeagueId) return
    setInviting(true)

    try {
      await inviteUserMutation.mutateAsync({
        leagueId: selectedLeagueId,
        email: inviteEmail,
      })
      setInviteEmail('')
      setInviteSearch('')
      setShowInviteModal(false)
    } catch (error) {
      console.error('Error inviting user:', error)
      alert(error instanceof Error ? error.message : 'Failed to invite user')
    } finally {
      setInviting(false)
    }
  }

  const handleSelectOrgMember = useCallback((member: any) => {
    setSelectedMemberIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(member.user?.id)) {
        newSet.delete(member.user?.id)
      } else {
        newSet.add(member.user?.id)
      }
      return newSet
    })
  }, [])

  // Memoize filtered members for performance with optimized search
  const filteredOrgMembers = useMemo(() => {
    if (!debouncedInviteSearch.trim()) return orgMembers

    // Pre-compute search term once
    const search = debouncedInviteSearch.toLowerCase()
    const searchLength = search.length

    // Use a more efficient filtering approach
    return orgMembers.filter((member: any) => {
      const user = member.user
      if (!user) return false

      // Early exit if search is empty (shouldn't happen, but safety check)
      if (searchLength === 0) return true

      // Check name
      const name = user.name
      if (name) {
        const nameLower = name.toLowerCase()
        if (nameLower.includes(search)) return true
      }

      // Check display name
      const displayName = user.profile?.displayName
      if (displayName) {
        const displayNameLower = displayName.toLowerCase()
        if (displayNameLower.includes(search)) return true
      }

      // Check email
      const email = user.email
      if (email) {
        const emailLower = email.toLowerCase()
        if (emailLower.includes(search)) return true
      }

      return false
    })
  }, [orgMembers, debouncedInviteSearch])

  const handleSelectAll = useCallback(() => {
    if (selectedMemberIds.size === filteredOrgMembers.length) {
      // Deselect all
      setSelectedMemberIds(new Set())
    } else {
      // Select all
      setSelectedMemberIds(new Set(filteredOrgMembers.map(m => m.user?.id).filter(Boolean)))
    }
  }, [filteredOrgMembers, selectedMemberIds.size])

  // Memoized member item component - compact row with checkbox
  const MemberItem = memo(({ member, isSelected, onToggle }: { member: any; isSelected: boolean; onToggle: () => void }) => {
    const displayName = member.user?.profile?.displayName || member.user?.name || 'Unknown'
    const fullName = member.user?.name || ''
    const showFullName = fullName && displayName !== fullName

    return (
      <div
        className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {displayName}
            {showFullName && (
              <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                ({fullName})
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }, (prevProps, nextProps) => {
    // Custom comparison - only re-render if member data or selection changes
    return (
      prevProps.member.id === nextProps.member.id &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.member.user?.email === nextProps.member.user?.email
    )
  })

  MemberItem.displayName = 'MemberItem'

  // Virtual scrolling setup for member list
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: filteredOrgMembers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Estimated height of each compact member row
    overscan: 5, // Render 5 extra items outside viewport for smooth scrolling
  })

  const handleEditLeague = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedLeague) return

    setEditing(true)

    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get('name') as string
      const description = formData.get('description') as string

      // Update league in local state for prototype
      const updatedLeagues = leagues.map(league =>
        league.id === selectedLeague.id
          ? { ...league, name, description: description || null, color: leagueColor }
          : league
      )

      queryClient.setQueryData(['private-leagues'], updatedLeagues)

      setShowEditModal(false)
      e.currentTarget.reset()
    } catch (error) {
      console.error('Error editing league:', error)
      alert('Failed to edit league')
    } finally {
      setEditing(false)
    }
  }

  const handleDeleteLeague = async () => {
    if (!selectedLeagueId) return

    setDeleting(true)

    try {
      await deleteLeagueMutation.mutateAsync(selectedLeagueId)
    } catch (error) {
      console.error('Error deleting league:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete league')
    } finally {
      setDeleting(false)
    }
  }

  const isCreator = (league: League) => {
    const userId = localStorage.getItem('userId')
    return league.createdByUserId === userId
  }

  const isMember = (league: League) => {
    const userId = localStorage.getItem('userId')
    // Members might not be loaded yet - check if they exist
    if (!league.members || league.members.length === 0) {
      // If no members array, we can't determine membership from list data
      // This will be handled by the full league details query
      return false
    }
    return league.members.some(member => member.userId === userId)
  }

  const handleLeaveLeague = async () => {
    if (!selectedLeague) return

    setLeaving(true)

    try {
      const userId = localStorage.getItem('userId')

      // Remove user from league members for prototype
      const updatedLeagues = leagues.map(league => {
        if (league.id === selectedLeague.id) {
          const currentMembers = league.members || []
          const filteredMembers = currentMembers.filter(member => member.userId !== userId)
          return {
            ...league,
            members: filteredMembers,
            _count: {
              members: filteredMembers.length
            }
          }
        }
        return league
      })

      queryClient.setQueryData(['private-leagues'], updatedLeagues)

      // Select first league if available, otherwise clear selection
      const updatedLeague = updatedLeagues.find(l => l.id === selectedLeague.id)
      const memberCount = updatedLeague?._count?.members ?? updatedLeague?.members?.length ?? 0
      if (updatedLeague && memberCount > 0) {
        setSelectedLeagueId(updatedLeague.id)
      } else {
        const otherLeagues = updatedLeagues.filter(l => l.id !== selectedLeague.id)
        if (otherLeagues.length > 0) {
          setSelectedLeagueId(otherLeagues[0].id)
        } else {
          setSelectedLeagueId(null)
        }
      }

      setShowLeaveModal(false)
    } catch (error) {
      console.error('Error leaving league:', error)
      alert('Failed to leave league')
    } finally {
      setLeaving(false)
    }
  }

  const handleKickMember = async () => {
    if (!selectedLeague || !memberToKick) return

    setKicking(true)

    try {
      // Remove member from league for prototype
      const updatedLeagues = leagues.map(league => {
        if (league.id === selectedLeague.id) {
          const currentMembers = league.members || []
          const filteredMembers = currentMembers.filter(member => member.userId !== memberToKick.id)
          return {
            ...league,
            members: filteredMembers,
            _count: {
              members: filteredMembers.length
            }
          }
        }
        return league
      })

      queryClient.setQueryData(['private-leagues'], updatedLeagues)
      setSelectedLeagueId(updatedLeagues.find(l => l.id === selectedLeague.id)?.id || null)
      setShowKickModal(false)
      setMemberToKick(null)
    } catch (error) {
      console.error('Error kicking member:', error)
      alert('Failed to kick member')
    } finally {
      setKicking(false)
    }
  }

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      alert('Invite code copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const displayName = (user: { id: string; name: string | null; email?: string; teamName: string | null; profile?: { displayName: string | null } | null }) => {
    // Prefer displayName from profile, then teamName, then name, then email
    if (user.profile?.displayName) return user.profile.displayName
    if (user.teamName) return user.teamName
    if (user.name) return user.name
    if (user.email) return user.email.split('@')[0]
    return `User ${user.id.slice(0, 8)}`
  }

  // Show loading state while checking auth/tier
  if (tierLoading) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-white dark:bg-[#0F1419] text-gray-900 dark:text-white pt-32 pb-16 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[hsl(var(--muted-foreground))]">Loading...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Show premium message only after loading is complete
  if (!isPremium) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-white dark:bg-[#0F1419] text-gray-900 dark:text-white pt-32 pb-16 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto text-center py-16">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Private Leagues</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Private leagues are only available to premium subscribers.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="inline-flex items-center justify-center h-12 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2"
            >
              Upgrade to Premium
            </button>
          </div>
          <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
        </main>
        <Footer />
      </>
    )
  }


  // Helper function to darken a color for hover states
  const darkenColor = (color: string, percent: number = 10): string => {
    const num = parseInt(color.replace('#', ''), 16)
    const r = Math.max(0, (num >> 16) - percent * 2.55)
    const g = Math.max(0, ((num >> 8) & 0x00FF) - percent * 2.55)
    const b = Math.max(0, (num & 0x0000FF) - percent * 2.55)
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  // Get the league color, defaulting to blue
  const leagueAccentColor = selectedLeague?.color || '#3B82F6'
  const leagueHoverColor = darkenColor(leagueAccentColor, 10)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white dark:bg-[#0F1419] text-gray-900 dark:text-white pt-24 sm:pt-32 pb-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">Private Leagues</h1>
                <p className="text-base text-gray-600 dark:text-gray-400">Set up and administrate private leagues</p>
              </div>
              {leagueRequests.length > 0 && (
                <div className="relative">
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{leagueRequests.length}</span>
                  </div>
                  <button
                    onClick={() => setShowRequestsModal(true)}
                    className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    title={`${leagueRequests.length} pending request${leagueRequests.length > 1 ? 's' : ''}`}
                  >
                    <Mail className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Organization Info */}
            {userOrg && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Organisations you belong to:
                </span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
                  <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-900 dark:text-blue-200">
                    {userOrg.name}
                  </span>
                </div>
              </div>
            )}

            {/* Pending Join Requests Section - Only show if user is admin of any leagues */}
            {leagueRequests.length > 0 && (
              <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Pending Join Requests ({leagueRequests.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowRequestsModal(true)}
                    className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-2">
                  {leagueRequests.slice(0, 3).map((request: LeagueRequest) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800/50 rounded-lg border border-amber-200 dark:border-amber-800"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {request.user.profile?.displayName || request.user.name || request.user.email}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          wants to join <span className="font-medium">{request.league.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => {
                            respondToRequestMutation.mutate({ requestId: request.id, action: 'approve' })
                          }}
                          disabled={respondToRequestMutation.isPending}
                          className="p-1.5 rounded-xl bg-[#059669] text-white hover:bg-[#047857] transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            respondToRequestMutation.mutate({ requestId: request.id, action: 'reject' })
                          }}
                          disabled={respondToRequestMutation.isPending}
                          className="p-1.5 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {leagueRequests.length > 3 && (
                    <button
                      onClick={() => setShowRequestsModal(true)}
                      className="w-full text-xs text-center text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 py-1"
                    >
                      View {leagueRequests.length - 3} more request{leagueRequests.length - 3 > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Available Organization Leagues */}
            {userOrg && (
              <OrganisationLeaguesSection
                organisationName={userOrg.name}
                onJoinByCode={() => setShowJoinByCodeModal(true)}
              />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Leagues List */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Leagues</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Leagues you've created or joined
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    aria-label="Create league"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {isLeaguesListLoading ? (
                  <LeaguesListSkeleton />
                ) : leaguesError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <p className="text-red-600 dark:text-red-400 mb-2 font-medium">
                      {leaguesError instanceof Error ? leaguesError.message : 'Failed to load leagues'}
                    </p>
                    {leaguesError instanceof Error && leaguesError.message.includes('migration') && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                        The database needs to be updated. If you're running locally, run the migrations.
                        If this is production, contact support.
                      </p>
                    )}
                    <button
                      onClick={() => refetchLeagues()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                  </div>
                ) : leagues.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-6">
                      <Trophy className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No leagues yet</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Create your first league to start competing</p>
                    </div>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 hover:bg-primary/90"
                    >
                      <Plus className="w-5 h-5" />
                      Create your first league
                    </button>
                  </div>
                ) : (
                  <DraggableLeaguesList
                    leagues={leagues}
                    selectedLeague={selectedLeague}
                    onSelectLeague={(league) => {
                      setSelectedLeagueId(league.id)
                    }}
                    onReorderLeagues={(newOrder) => {
                      // Optimistically update cache
                      queryClient.setQueryData(['private-leagues'], newOrder)
                      cacheLeagues(newOrder)
                      saveLeagueOrder(newOrder)
                    }}
                    leagueAccentColor={leagueAccentColor}
                  />
                )}
              </div>
            </div>

            {/* League Details */}
            <div className="lg:col-span-2 space-y-4">
              {isDetailsLoading ? (
                <LeagueDetailsSkeleton />
              ) : statsError && selectedLeague ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-4 shadow-sm">
                  <div className="text-center py-6">
                    <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
                    <p className="text-red-600 dark:text-red-400 mb-3">
                      {statsError instanceof Error ? statsError.message : 'Failed to load league stats'}
                    </p>
                    <button
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['league-stats', selectedLeagueId] })}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                  </div>
                </div>
              ) : selectedLeague ? (
                <>
                  {/* League Header */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Color indicator */}
                          {selectedLeague.color && (
                            <div
                              className="w-4 h-4 rounded-full shrink-0 border border-gray-300 dark:border-gray-600"
                              style={{ backgroundColor: selectedLeague.color }}
                            />
                          )}
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{selectedLeague.name}</h2>
                          {selectedLeague.organisation && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800 shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span className="text-xs font-medium text-blue-900 dark:text-blue-200">
                                {selectedLeague.organisation.name}
                              </span>
                            </div>
                          )}
                        </div>
                        {selectedLeague.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">{selectedLeague.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCreator(selectedLeague) && (
                          <>
                            <button
                              onClick={() => {
                                setLeagueColor(selectedLeague?.color || '#3B82F6')
                                setShowEditModal(true)
                              }}
                              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-xl text-sm font-medium hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2"
                              title="Edit league"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(true)}
                              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 border border-destructive text-destructive rounded-xl text-sm font-medium hover:bg-destructive/10 transition-colors focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
                              title="Delete league"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {!isCreator(selectedLeague) && isMember(selectedLeague) && (
                          <button
                            onClick={() => setShowLeaveModal(true)}
                            className="inline-flex items-center justify-center gap-1.5 h-8 px-3 border border-[#F59E0B] text-[#F59E0B] rounded-xl text-sm font-medium hover:bg-[#F59E0B]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2"
                            title="Leave league"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Leave</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowInviteModal(true)
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 text-white rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                          style={{
                            backgroundColor: leagueAccentColor
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = leagueHoverColor}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = leagueAccentColor}
                          onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${leagueAccentColor}`}
                          onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                          title="Invite"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Members List */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">
                        Members ({selectedLeague.members?.length ?? selectedLeague._count?.members ?? 0})
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        People who have joined this league
                      </p>
                    </div>
                    <div className="space-y-2">
                      {selectedLeagueLoading && !selectedLeague.members ? (
                        <div className="space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 animate-pulse"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600/50" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-600/50 rounded w-32" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : selectedLeague.members && selectedLeague.members.length > 0 ? (
                        selectedLeague.members.map((member) => {
                          const isYou = member.userId === localStorage.getItem('userId')
                          const isCreatorMember = member.userId === selectedLeague.createdByUserId
                          return (
                            <div
                              key={member.id}
                              className={`flex items-center justify-between p-2 rounded-xl ${isYou
                                ? 'border border-[hsl(var(--border))]'
                                : 'bg-secondary'
                                }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full text-white flex items-center justify-center font-semibold text-xs" style={{ backgroundColor: leagueAccentColor }}>
                                  {displayName(member.user).charAt(0)}
                                </div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {displayName(member.user)} {isYou && <span className="text-gray-500 dark:text-gray-400">(You)</span>} {isCreatorMember && !isYou && <span className="text-gray-500 dark:text-gray-400">(Creator)</span>}
                                </div>
                              </div>
                              {isCreator(selectedLeague) && !isYou && (
                                <button
                                  onClick={() => {
                                    setMemberToKick({
                                      id: member.userId,
                                      name: displayName(member.user)
                                    })
                                    setShowKickModal(true)
                                  }}
                                  className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                                  title="Kick member"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No members yet</p>
                      )}
                    </div>
                  </div>

                </>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 shadow-sm">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a league to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Join by Code Modal */}
        {showJoinByCodeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Join League</h3>
                <button
                  onClick={() => setShowJoinByCodeModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const inviteCode = formData.get('inviteCode') as string
                  if (!inviteCode?.trim()) {
                    alert('Please enter an invite code')
                    return
                  }
                  try {
                    await joinByCodeMutation.mutateAsync(inviteCode.trim().toUpperCase())
                  } catch (error) {
                    console.error('Error joining league:', error)
                    alert(error instanceof Error ? error.message : 'Failed to join league')
                  }
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Invite Code
                    </label>
                    <input
                      type="text"
                      name="inviteCode"
                      placeholder="Enter code"
                      className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] font-mono text-sm tracking-wider uppercase"
                      required
                      autoFocus
                      disabled={joinByCodeMutation.isPending}
                      maxLength={8}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                      }}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      Enter the 8-character invite code
                    </p>
                  </div>
                  {joinByCodeMutation.isError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {joinByCodeMutation.error instanceof Error
                          ? joinByCodeMutation.error.message
                          : 'Failed to join league'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-6">
                  <button
                    type="submit"
                    disabled={joinByCodeMutation.isPending}
                    className="flex-1 inline-flex items-center justify-center h-11 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2"
                  >
                    {joinByCodeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join League'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowJoinByCodeModal(false)}
                    className="px-4 h-11 inline-flex items-center justify-center border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-xl font-medium hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Create League Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create League</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateLeague}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">League Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${leagueColor}`}
                      onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                      placeholder="e.g., Team Awesome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Description (optional)</label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent resize-none transition-all"
                      placeholder="Describe your league..."
                    />
                  </div>
                  {userOrg && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
                            This league will be associated with {userOrg.name}
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                            Members of your organization can request to join
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-white">League Color</label>
                    <div className="grid grid-cols-8 gap-2">
                      {[
                        '#3B82F6', // Blue
                        '#8B5CF6', // Purple
                        '#10B981', // Emerald
                        '#F59E0B', // Amber
                        '#EF4444', // Red
                        '#EC4899', // Pink
                        '#06B6D4', // Cyan
                        '#84CC16', // Lime
                        '#6366F1', // Indigo
                        '#F97316', // Orange
                        '#14B8A6', // Teal
                        '#A855F7', // Violet
                        '#22C55E', // Green
                        '#EAB308', // Yellow
                        '#F43F5E', // Rose
                        '#0EA5E9', // Sky
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setLeagueColor(color)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${leagueColor === color
                            ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2'
                            : 'border-gray-200 dark:border-gray-600 hover:scale-105'
                            }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={creating || createLeagueMutation.isPending}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2"
                    >
                      {(creating || createLeagueMutation.isPending) && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {creating || createLeagueMutation.isPending ? 'Creating...' : 'Create League'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 h-11 inline-flex items-center justify-center border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-xl font-medium hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit League Modal */}
        {showEditModal && selectedLeague && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit League</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditLeague}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">League Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={selectedLeague.name}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${leagueColor}`}
                      onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                      placeholder="e.g., Team Awesome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Description (optional)</label>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={selectedLeague.description || ''}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-all"
                      style={{ '--tw-ring-color': leagueColor } as React.CSSProperties}
                      onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${leagueColor}`}
                      onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                      placeholder="Describe your league..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-white">League Color</label>
                    <div className="grid grid-cols-8 gap-2">
                      {[
                        '#3B82F6', // Blue
                        '#8B5CF6', // Purple
                        '#10B981', // Emerald
                        '#F59E0B', // Amber
                        '#EF4444', // Red
                        '#EC4899', // Pink
                        '#06B6D4', // Cyan
                        '#84CC16', // Lime
                        '#6366F1', // Indigo
                        '#F97316', // Orange
                        '#14B8A6', // Teal
                        '#A855F7', // Violet
                        '#22C55E', // Green
                        '#EAB308', // Yellow
                        '#F43F5E', // Rose
                        '#0EA5E9', // Sky
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setLeagueColor(color)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${leagueColor === color
                            ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2'
                            : 'border-gray-200 dark:border-gray-600 hover:scale-105'
                            }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={editing}
                      className="flex-1 inline-flex items-center justify-center h-11 px-4 text-white rounded-full font-medium transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: leagueColor,
                        '--tw-ring-color': leagueColor,
                      } as React.CSSProperties}
                      onMouseEnter={(e) => {
                        if (!editing) {
                          e.currentTarget.style.backgroundColor = darkenColor(leagueColor, 10)
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!editing) {
                          e.currentTarget.style.backgroundColor = leagueColor
                        }
                      }}
                    >
                      {editing ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 h-11 inline-flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedLeague && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete League</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{selectedLeague.name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleDeleteLeague}
                    disabled={deleting || deleteLeagueMutation.isPending}
                    className="flex-1 inline-flex items-center justify-center h-11 px-4 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                  >
                    {(deleting || deleteLeagueMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete League'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 h-11 inline-flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Leave League Modal */}
        {showLeaveModal && selectedLeague && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Leave League</h3>
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to leave <span className="font-semibold text-gray-900 dark:text-white">{selectedLeague.name}</span>? You can rejoin later using the invite code.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleLeaveLeague}
                    disabled={leaving}
                    className="flex-1 inline-flex items-center justify-center h-11 px-4 bg-orange-600 text-white rounded-full font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2"
                  >
                    {leaving ? 'Leaving...' : 'Leave League'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(false)}
                    className="px-4 h-11 inline-flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Kick Member Modal */}
        {showKickModal && selectedLeague && memberToKick && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Kick Member</h3>
                <button
                  onClick={() => {
                    setShowKickModal(false)
                    setMemberToKick(null)
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to kick <span className="font-semibold text-gray-900 dark:text-white">{memberToKick.name}</span> from <span className="font-semibold text-gray-900 dark:text-white">{selectedLeague.name}</span>? They can rejoin using the invite code.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleKickMember}
                    disabled={kicking}
                    className="flex-1 inline-flex items-center justify-center h-11 px-4 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                  >
                    {kicking ? 'Kicking...' : 'Kick Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowKickModal(false)
                      setMemberToKick(null)
                    }}
                    className="px-4 h-11 inline-flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && selectedLeague && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Invite to League</h3>
                <button
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteEmail('')
                    setInviteSearch('')
                    setSelectedMemberIds(new Set())
                    setInviteMode('org')
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Tabs */}
              <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
                {userOrg && orgMembers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setInviteMode('org')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${inviteMode === 'org'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                  >
                    <Building2 className="w-4 h-4 inline-block mr-2" />
                    {userOrg.name} Members
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setInviteMode('external')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${inviteMode === 'external'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  <Mail className="w-4 h-4 inline-block mr-2" />
                  External Email
                </button>
                <button
                  type="button"
                  onClick={() => setInviteMode('code')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${inviteMode === 'code'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  <KeyRound className="w-4 h-4 inline-block mr-2" />
                  Invite Code
                </button>
              </div>

              <form onSubmit={handleInvite} className="flex-1 flex flex-col min-h-0">
                {inviteMode === 'org' && userOrg ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Search */}
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={inviteSearch}
                          onChange={(e) => setInviteSearch(e.target.value)}
                          placeholder="Search organization members..."
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                          onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${leagueColor}`}
                          onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                        />
                      </div>
                    </div>

                    {/* Select All Checkbox */}
                    {filteredOrgMembers.length > 0 && (
                      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                        <label className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMemberIds.size > 0 && selectedMemberIds.size === filteredOrgMembers.length}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select All ({selectedMemberIds.size} selected)
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Member List with Virtual Scrolling */}
                    <div
                      ref={parentRef}
                      className="flex-1 overflow-y-auto mb-4 min-h-0"
                      style={{ height: '400px' }} // Fixed height for virtual scrolling
                    >
                      {loadingOrgMembers ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                          <p className="text-sm">Loading members...</p>
                        </div>
                      ) : orgMembers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No available members to invite</p>
                        </div>
                      ) : filteredOrgMembers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No members found matching "{debouncedInviteSearch}"</p>
                        </div>
                      ) : (
                        <div
                          style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                          }}
                        >
                          {virtualizer.getVirtualItems().map((virtualItem) => {
                            const member = filteredOrgMembers[virtualItem.index]
                            const isSelected = selectedMemberIds.has(member.user?.id)
                            return (
                              <div
                                key={String(virtualItem.key)}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: `${virtualItem.size}px`,
                                  transform: `translateY(${virtualItem.start}px)`,
                                }}
                                className="pr-2"
                              >
                                <MemberItem
                                  member={member}
                                  isSelected={isSelected}
                                  onToggle={() => handleSelectOrgMember(member)}
                                />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Selected Members Display */}
                    {selectedMemberIds.size > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                          {selectedMemberIds.size} member{selectedMemberIds.size > 1 ? 's' : ''} selected
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {filteredOrgMembers
                            .filter(m => selectedMemberIds.has(m.user?.id))
                            .map(member => (
                              <span
                                key={member.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs"
                              >
                                {member.user?.profile?.displayName || member.user?.name || member.user?.email}
                                <button
                                  type="button"
                                  onClick={() => handleSelectOrgMember(member)}
                                  className="hover:text-blue-900 dark:hover:text-blue-100"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    {/* Premium Requirement Notice */}
                    <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                            Premium Membership Required
                          </h4>
                          <p className="text-sm text-amber-800 dark:text-amber-300">
                            Only users with an active premium subscription can accept league invitations.
                            The recipient must have a premium account to join this league.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${leagueColor}`}
                        onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                        placeholder="friend@example.com"
                      />

                      {/* Selected Email Display (External Mode) */}
                      {inviteEmail && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                            Selected:
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            {inviteEmail}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {inviteMode !== 'code' && (
                    <button
                      type="submit"
                      disabled={
                        inviting ||
                        (inviteMode === 'org' && selectedMemberIds.size === 0) ||
                        (inviteMode === 'external' && !inviteEmail.trim())
                      }
                      className="flex-1 inline-flex items-center justify-center h-11 px-4 text-white rounded-full font-medium transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: (inviteMode === 'org' && selectedMemberIds.size > 0) || (inviteMode === 'external' && inviteEmail.trim())
                          ? leagueColor
                          : '#9CA3AF',
                      }}
                    >
                      {inviting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Inviting...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          {inviteMode === 'org' && selectedMemberIds.size > 0
                            ? `Invite ${selectedMemberIds.size} Member${selectedMemberIds.size > 1 ? 's' : ''}`
                            : 'Invite'}
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false)
                      setInviteEmail('')
                      setInviteSearch('')
                      setSelectedMemberIds(new Set())
                      setInviteMode('org')
                    }}
                    className="px-4 h-11 inline-flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* League Requests Modal */}
        {showRequestsModal && leagueRequests.length > 0 && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full shadow-xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Join Requests ({leagueRequests.length})
                </h3>
                <button
                  onClick={() => setShowRequestsModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {leagueRequests.map((request: LeagueRequest) => (
                  <div
                    key={request.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {request.user.name || request.user.email}
                          </h4>
                          {request.user.teamName && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                              {request.user.teamName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Wants to join <span className="font-medium">{request.league.name}</span>
                        </p>
                        {request.league.organisation && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {request.league.organisation.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {new Date(request.requestedAt).toLocaleDateString()} at {new Date(request.requestedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          respondToRequestMutation.mutate({ requestId: request.id, action: 'approve' })
                        }}
                        disabled={respondToRequestMutation.isPending}
                        className="flex-1 inline-flex items-center justify-center gap-2 h-9 px-4 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          respondToRequestMutation.mutate({ requestId: request.id, action: 'reject' })
                        }}
                        disabled={respondToRequestMutation.isPending}
                        className="flex-1 inline-flex items-center justify-center gap-2 h-9 px-4 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </main>
      <Footer />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  )
}

