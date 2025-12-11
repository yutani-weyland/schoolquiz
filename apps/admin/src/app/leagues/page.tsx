'use client'

import { useState, useMemo, useEffect } from 'react'
import { Trophy, Plus, KeyRound } from 'lucide-react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useUserTier } from '@/hooks/useUserTier'
import { useUserAccess } from '@/contexts/UserAccessContext'
import dynamic from 'next/dynamic'
import { Footer } from '@/components/Footer'
import {
  fetchLeagues,
  fetchLeagueDetails,
  fetchLeagueMembers,
  getCachedLeagues,
  cacheLeagues,
  type League,
} from '@/lib/leagues-fetch'
import { LeaguesSections } from '@/components/leagues/LeaguesSections'
import { OrganisationLeaguesSection } from '@/components/leagues/OrganisationLeaguesSection'
import { LeaguesListSkeleton } from '@/components/leagues/LeaguesSkeleton'
import { PageHeader } from '@/components/layout/PageHeader'

// Lazy load SiteHeader
const LazySiteHeader = dynamic(
  () => import("@/components/SiteHeader").then(mod => ({ default: mod.SiteHeader })),
  {
    ssr: true,
    loading: () => (
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-[#0F1419] border-b border-gray-200 dark:border-gray-700" />
    )
  }
)

// Lazy load all modals to reduce initial bundle size
const LazyCreateLeagueModal = dynamic(
  () => import('@/components/leagues/CreateLeagueModal').then(mod => ({ default: mod.CreateLeagueModal })),
  { ssr: false }
)

const LazyLeagueInviteModal = dynamic(
  () => import('@/components/leagues/LeagueInviteModal').then(mod => ({ default: mod.LeagueInviteModal })),
  { ssr: false }
)

const LazyLeagueMembersModal = dynamic(
  () => import('@/components/leagues/LeagueMembersModal').then(mod => ({ default: mod.LeagueMembersModal })),
  { ssr: false }
)

const LazyJoinByCodeModal = dynamic(
  () => import('@/components/leagues/JoinByCodeModal').then(mod => ({ default: mod.JoinByCodeModal })),
  { ssr: false }
)

const LazyManageLeagueModal = dynamic(
  () => import('@/components/leagues/ManageLeagueModal').then(mod => ({ default: mod.ManageLeagueModal })),
  { ssr: false }
)

const LazyUpgradeModal = dynamic(
  () => import('@/components/premium/UpgradeModal').then(mod => ({ default: mod.UpgradeModal })),
  { ssr: false }
)

const LazyLeagueRequestsNotification = dynamic(
  () => import('@/components/leagues/LeagueRequestsNotification').then(mod => ({ default: mod.LeagueRequestsNotification })),
  { ssr: false }
)

export default function LeaguesPage() {
  const { data: session } = useSession()
  const { tier, isPremium, isLoading: tierLoading } = useUserTier()
  const { userName } = useUserAccess()
  const queryClient = useQueryClient()

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [removingMember, setRemovingMember] = useState<string | null>(null) // userId being removed
  const [removingTeam, setRemovingTeam] = useState<string | null>(null) // teamId being removed
  const [leavingLeagueId, setLeavingLeagueId] = useState<string | null>(null)

  const platformRole = typeof window !== 'undefined' ? localStorage.getItem('platformRole') : null
  const isAdmin = platformRole === 'PLATFORM_ADMIN' || platformRole === 'ORG_ADMIN'
  // OPTIMIZATION: Use session tier directly to avoid waiting for tierLoading
  const sessionTier = (session?.user as any)?.tier
  const hasAccessFromSession = sessionTier === 'premium' || isAdmin
  const hasAccess = isPremium || isAdmin
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null

  // Get cached leagues for instant initial render
  const cachedLeagues = useMemo(() => getCachedLeagues(), [])

  // OPTIMIZATION: Parallelize initial queries - remove tierLoading dependency
  // Fetch leagues - enabled based on session, not tierLoading
  const {
    data: leagues = cachedLeagues || [],
    isLoading: leaguesLoading,
    error: leaguesError,
  } = useQuery({
    queryKey: ['private-leagues'],
    queryFn: async () => {
      const data = await fetchLeagues()
      cacheLeagues(data)
      return data
    },
    enabled: hasAccessFromSession && !!session, // Use session-based access check
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    initialData: cachedLeagues || undefined,
    placeholderData: cachedLeagues || undefined,
  })

  // OPTIMIZATION: Fetch league details as soon as selectedLeagueId is set (remove modal state dependency)
  const { data: selectedLeagueDetails, isLoading: loadingLeagueDetails, isFetching: fetchingLeagueDetails } = useQuery({
    queryKey: ['league-details', selectedLeagueId],
    queryFn: () => fetchLeagueDetails(selectedLeagueId!, false), // Never include members - use /members endpoint instead
    enabled: !!selectedLeagueId && hasAccessFromSession && !!session, // Fetch immediately when league is selected
    staleTime: 30 * 1000,
  })

  const selectedLeague = useMemo(() => {
    if (!selectedLeagueId) return null
    if (selectedLeagueDetails) return selectedLeagueDetails
    return leagues.find(l => l.id === selectedLeagueId) || null
  }, [selectedLeagueId, selectedLeagueDetails, leagues])

  // OPTIMIZATION: Parallelize user organisation query - remove tierLoading dependency
  const { data: userOrg } = useQuery({
    queryKey: ['user-organisation'],
    queryFn: async () => {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      if (!userId) return null
      const response = await fetch('/api/user/organisation', {
        credentials: 'include',
      })
      if (!response.ok) return null
      const data = await response.json()
      return data.organisation || null
    },
    enabled: hasAccessFromSession && !!session, // Use session-based access check
    staleTime: 5 * 60 * 1000,
  })

  // OPTIMIZATION: Convert org members fetch to React Query for better parallelization
  // Don't wait for selectedLeague - fetch as soon as userOrg is available and modal is open
  const { data: orgMembersData, isLoading: loadingOrgMembers } = useQuery({
    queryKey: ['org-members', userOrg?.id, selectedLeagueId],
    queryFn: async ({ queryKey }) => {
      const [, orgId, leagueId] = queryKey as [string, string | undefined, string | null]
      if (!orgId) return []

      const response = await fetch(`/api/organisation/${orgId}/members`, {
        credentials: 'include',
      })
      if (!response.ok) return []
      const data = await response.json()

      // Get league details from cache if available to filter existing members
      const cachedLeagues = queryClient.getQueryData<League[]>(['private-leagues']) || []
      const leagueDetails = leagueId
        ? (queryClient.getQueryData<League>(['league-details', leagueId]) ||
          cachedLeagues.find(l => l.id === leagueId))
        : null

      // Filter out current user and existing league members
      const existingMemberIds = new Set(leagueDetails?.members?.map(m => m.userId) || [])
      return (data.members || []).filter((m: any) =>
        m.user?.id !== currentUserId &&
        !existingMemberIds.has(m.user?.id) &&
        m.status === 'ACTIVE'
      )
    },
    enabled: showInviteModal && !!userOrg?.id && hasAccessFromSession, // Fetch when modal opens and userOrg is available
    staleTime: 5 * 60 * 1000,
  })

  const orgMembers = orgMembersData || []

  // OPTIMIZATION: Prefetch league details and members for visible leagues
  // This starts loading data before user clicks, making modals instant
  useEffect(() => {
    if (!leagues.length || !hasAccessFromSession || !session) return

    // Prefetch details for first 6 visible leagues (typically what's on screen)
    const leaguesToPrefetch = leagues.slice(0, 6)

    leaguesToPrefetch.forEach((league) => {
      // Prefetch league details (lightweight, no members)
      queryClient.prefetchQuery({
        queryKey: ['league-details', league.id],
        queryFn: () => fetchLeagueDetails(league.id, false),
        staleTime: 30 * 1000,
      })

      // Prefetch first page of members (for members modal)
      queryClient.prefetchQuery({
        queryKey: ['league-members', league.id],
        queryFn: () => fetchLeagueMembers(league.id, 50, 0),
        staleTime: 10 * 1000,
      })
    })
  }, [leagues, hasAccessFromSession, session, queryClient])

  // Create league mutation
  const createLeagueMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; color: string; organisationId?: string | null; teamIds?: string[] }) => {
      const response = await fetch('/api/private-leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch {
          // If response isn't JSON, use status text
          throw new Error(`Failed to create league: ${response.statusText} (${response.status})`)
        }
        // Extract error message from various possible formats
        const errorMessage = errorData.error || errorData.message || errorData.details || `Failed to create league (${response.status})`
        const error = new Error(errorMessage)
        // Attach additional details for debugging
        ;(error as any).details = errorData
        console.error('[Client] League creation error:', {
          status: response.status,
          errorData,
          hint: errorData.hint,
        })
        throw error
      }
      const result = await response.json()
      // Ensure the response has the expected structure
      if (!result.league) {
        console.error('API response missing league:', result)
        throw new Error('Invalid response from server: missing league data')
      }
      return result
    },
    onSuccess: (data) => {
      if (!data || !data.league) {
        console.error('Invalid league data received:', data)
        return
      }
      const newLeague = data.league
      queryClient.setQueryData(['private-leagues'], (old: League[] = []) => {
        const updated = [newLeague, ...old]
        cacheLeagues(updated)
        return updated
      })
      setSelectedLeagueId(newLeague.id)
      setShowCreateModal(false)
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
    },
  })

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ leagueId, email }: { leagueId: string; email: string }) => {
      const response = await fetch(`/api/private-leagues/${leagueId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to invite user')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
      queryClient.invalidateQueries({ queryKey: ['league-details', selectedLeagueId] })
      setInviteEmail('')
      setShowInviteModal(false)
    },
  })

  const handleCreateLeague = async (data: { name: string; description: string; color: string; organisationId?: string | null; teamIds?: string[] }) => {
    setCreating(true)
    try {
      await createLeagueMutation.mutateAsync(data)
    } catch (error) {
      let errorMessage = 'Failed to create league'
      if (error instanceof Error) {
        errorMessage = error.message
        // Include hint if available
        const details = (error as any).details
        if (details?.hint) {
          errorMessage += `\n\n${details.hint}`
        }
        if (details?.message && details.message !== error.message) {
          errorMessage += `\n\nDetails: ${details.message}`
        }
      }
      console.error('Error creating league:', error)
      alert(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  const handleInviteByEmail = async (email: string) => {
    if (!selectedLeagueId) return
    setInviting(true)
    try {
      await inviteMutation.mutateAsync({ leagueId: selectedLeagueId, email })
      alert('Successfully invited user!')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to invite user')
    } finally {
      setInviting(false)
    }
  }

  const handleInviteOrgMembers = async (memberIds: string[]) => {
    if (!selectedLeagueId) return
    setInviting(true)
    try {
      // Invite each member
      await Promise.all(
        memberIds.map(memberId => {
          const member = orgMembers.find((m: any) => m.user?.id === memberId)
          const email = member?.user?.email
          if (!email) return Promise.resolve()
          return inviteMutation.mutateAsync({ leagueId: selectedLeagueId, email })
        })
      )
      alert(`Successfully invited ${memberIds.length} member${memberIds.length > 1 ? 's' : ''}!`)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to invite members')
    } finally {
      setInviting(false)
    }
  }

  // Join by code mutation
  const joinByCodeMutation = useMutation({
    mutationFn: async ({ inviteCode, teamId }: { inviteCode: string; teamId?: string }) => {
      const response = await fetch('/api/private-leagues/join-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ inviteCode, teamId }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to join league')
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['private-leagues'], (old: League[] = []) => {
        const newLeague = data.league
        const exists = old.some(l => l.id === newLeague.id)
        if (exists) return old
        const updated = [newLeague, ...old]
        cacheLeagues(updated)
        return updated
      })
      setSelectedLeagueId(data.league.id)
      setShowJoinByCodeModal(false)
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
    },
  })

  const handleJoinByCode = async (code: string, teamId?: string) => {
    setJoining(true)
    try {
      await joinByCodeMutation.mutateAsync({ inviteCode: code, teamId })
    } catch (error) {
      throw error // Let modal handle error display
    } finally {
      setJoining(false)
    }
  }

  // Update league mutation
  const updateLeagueMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description: string; color: string } }) => {
      const response = await fetch(`/api/private-leagues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to update league')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
      queryClient.invalidateQueries({ queryKey: ['league-details', selectedLeagueId] })
      setShowManageModal(false)
    },
  })

  // Delete league mutation
  const deleteLeagueMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/private-leagues/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to delete league')
      }
      return response.json()
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['private-leagues'], (old: League[] = []) => {
        const updated = old.filter(l => l.id !== deletedId)
        cacheLeagues(updated)
        if (updated.length > 0) {
          setSelectedLeagueId(updated[0].id)
        } else {
          setSelectedLeagueId(null)
        }
        return updated
      })
      queryClient.removeQueries({ queryKey: ['league-details', deletedId] })
      setShowManageModal(false)
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
    },
  })

  const handleUpdateLeague = async (id: string, data: { name: string; description: string; color: string }) => {
    setUpdating(true)
    try {
      await updateLeagueMutation.mutateAsync({ id, data })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update league')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteLeague = async (id: string) => {
    setDeleting(true)
    try {
      await deleteLeagueMutation.mutateAsync(id)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete league')
    } finally {
      setDeleting(false)
    }
  }

  const handleKickMember = async (userId: string, userName: string) => {
    if (!selectedLeagueId) return
    
    // Confirmation dialog
    if (!confirm(`Remove ${userName} from this league?`)) return
    
    setRemovingMember(userId)
    try {
      const response = await fetch(`/api/private-leagues/${selectedLeagueId}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to remove member')
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
      queryClient.invalidateQueries({ queryKey: ['league-details', selectedLeagueId] })
      queryClient.invalidateQueries({ queryKey: ['league-members', selectedLeagueId] })
      
      // Show success message (could be replaced with toast notification)
      // For now, the UI will update automatically via query invalidation
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove member'
      alert(errorMessage)
    } finally {
      setRemovingMember(null)
    }
  }

  const handleRemoveTeam = async (teamId: string, teamName: string) => {
    if (!selectedLeagueId) return
    
    // Confirmation dialog
    if (!confirm(`Remove ${teamName} from this league?`)) return
    
    setRemovingTeam(teamId)
    try {
      const response = await fetch(`/api/private-leagues/${selectedLeagueId}/teams/${teamId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to remove team')
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
      queryClient.invalidateQueries({ queryKey: ['league-details', selectedLeagueId] })
      queryClient.invalidateQueries({ queryKey: ['league-teams', selectedLeagueId] })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove team'
      alert(errorMessage)
    } finally {
      setRemovingTeam(null)
    }
  }

  const handleLeaveLeague = async (leagueId: string) => {
    const league = leagues.find(l => l.id === leagueId)
    if (!league) return
    
    if (!confirm(`Leave ${league.name}? You can rejoin later using the invite code.`)) return
    
    setLeavingLeagueId(leagueId)
    try {
      const response = await fetch(`/api/private-leagues/${leagueId}/join`, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to leave league')
      }
      
      // Remove league from cache and invalidate queries
      queryClient.setQueryData(['private-leagues'], (old: League[] = []) => {
        const updated = old.filter(l => l.id !== leagueId)
        cacheLeagues(updated)
        return updated
      })
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave league'
      alert(errorMessage)
    } finally {
      setLeavingLeagueId(null)
    }
  }

  const isCreator = (league: League) => {
    return league.createdByUserId === currentUserId
  }

  // Loading state
  if (tierLoading) {
    return (
      <>
        <LazySiteHeader />
        <main className="min-h-screen bg-gray-50 dark:bg-[#0F1419] pt-32 pb-16">
          <div className="max-w-[1600px] mx-auto px-6 sm:px-6 lg:px-8 xl:px-12">
            <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Premium gate
  if (!hasAccess) {
    return (
      <>
        <LazySiteHeader />
        <main className="min-h-screen bg-gray-50 dark:bg-[#0F1419] pt-32 pb-16">
          <div className="max-w-[1600px] mx-auto px-6 sm:px-6 lg:px-8 xl:px-12">
            <div className="text-center py-16">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Private Leagues</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Private leagues are only available to premium subscribers.
              </p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="inline-flex items-center justify-center h-12 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
          <LazyUpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <LazySiteHeader />
      <main className="min-h-screen bg-gray-50 dark:bg-[#0F1419] pt-24 pb-16">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-6 lg:px-8 xl:px-12">
          {/* Header - Centered like custom quizzes */}
          <div className="mb-8 sm:mb-12 md:mb-16">
            <PageHeader
              title="Private Leagues"
              subtitle="Create leagues, invite members, and compete together"
              centered
              maxWidth="4xl"
            />
            {/* League Requests Notification */}
            <div className="flex items-center justify-center">
              <LazyLeagueRequestsNotification />
            </div>
          </div>

          {/* Organisation Leagues Section */}
          {userOrg && (
            <div className="mb-8">
              <OrganisationLeaguesSection
                organisationName={userOrg.name}
                onJoinByCode={() => setShowJoinByCodeModal(true)}
              />
            </div>
          )}

          {/* My Leagues Section */}
          {leaguesLoading && leagues.length === 0 ? (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  My Leagues
                </h2>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                </div>
              </div>
              <LeaguesListSkeleton />
            </section>
          ) : leaguesError ? (
            <div className="text-center py-16">
              <p className="text-red-600 dark:text-red-400 mb-4">
                {leaguesError instanceof Error ? leaguesError.message : 'Failed to load leagues'}
              </p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['private-leagues'] })}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <LeaguesSections
              leagues={leagues}
              currentUserId={currentUserId}
              onCreateLeague={() => setShowCreateModal(true)}
              onJoinByCode={() => setShowJoinByCodeModal(true)}
              onInvite={(leagueId) => {
                setSelectedLeagueId(leagueId)
                setShowInviteModal(true)
              }}
              onManage={(leagueId) => {
                setSelectedLeagueId(leagueId)
                setShowManageModal(true)
              }}
              onViewMembers={(leagueId) => {
                setSelectedLeagueId(leagueId)
                setShowMembersModal(true)
              }}
              onLeaveLeague={handleLeaveLeague}
              onDelete={handleDeleteLeague}
              isCreator={isCreator}
            />
          )}
        </div>
      </main>
      <Footer />

      {/* Modals - Only render when open to reduce DOM nodes */}
      {showCreateModal && (
        <LazyCreateLeagueModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateLeague}
          creating={creating || createLeagueMutation.isPending}
          userOrg={userOrg || null}
        />
      )}

      {showInviteModal && (
        <LazyLeagueInviteModal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false)
            setSelectedLeagueId(null)
          }}
          league={selectedLeague}
          isLoading={loadingLeagueDetails || fetchingLeagueDetails}
          userOrg={userOrg || null}
          orgMembers={orgMembers}
          loadingOrgMembers={loadingOrgMembers}
          onInviteByEmail={handleInviteByEmail}
          onInviteOrgMembers={handleInviteOrgMembers}
          inviting={inviting || inviteMutation.isPending}
        />
      )}

      {showMembersModal && (
        <LazyLeagueMembersModal
          isOpen={showMembersModal}
          onClose={() => {
            setShowMembersModal(false)
            setSelectedLeagueId(null)
          }}
          league={selectedLeague}
          isLoading={loadingLeagueDetails || fetchingLeagueDetails}
          currentUserId={currentUserId}
          isCreator={selectedLeague ? isCreator(selectedLeague) : false}
          onKickMember={handleKickMember}
          removingMemberId={removingMember}
          onRemoveTeam={handleRemoveTeam}
          removingTeamId={removingTeam}
          onInvite={() => {
            setShowMembersModal(false)
            setShowInviteModal(true)
          }}
        />
      )}

      {showJoinByCodeModal && (
        <LazyJoinByCodeModal
          isOpen={showJoinByCodeModal}
          onClose={() => setShowJoinByCodeModal(false)}
          onJoin={handleJoinByCode}
          joining={joining || joinByCodeMutation.isPending}
        />
      )}

      {showManageModal && (
        <LazyManageLeagueModal
          isOpen={showManageModal}
          onClose={() => {
            setShowManageModal(false)
            setSelectedLeagueId(null)
          }}
          league={selectedLeague}
          isLoading={loadingLeagueDetails || fetchingLeagueDetails}
          onUpdate={handleUpdateLeague}
          onDelete={handleDeleteLeague}
          updating={updating || updateLeagueMutation.isPending}
          deleting={deleting || deleteLeagueMutation.isPending}
          userOrg={userOrg || null}
        />
      )}

      {showUpgradeModal && (
        <LazyUpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      )}
    </>
  )
}

