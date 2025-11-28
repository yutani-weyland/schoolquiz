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
import { LeaguesGrid } from '@/components/leagues/LeaguesGrid'
import { LeaguesTabs, type LeagueTab } from '@/components/leagues/LeaguesTabs'
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

  const [activeTab, setActiveTab] = useState<LeagueTab>('created')
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
    mutationFn: async (data: { name: string; description: string; color: string; organisationId?: string | null }) => {
      const response = await fetch('/api/private-leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to create league')
      }
      return response.json()
    },
    onSuccess: (data) => {
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

  const handleCreateLeague = async (data: { name: string; description: string; color: string; organisationId?: string | null }) => {
    setCreating(true)
    try {
      await createLeagueMutation.mutateAsync(data)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create league')
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
    mutationFn: async (inviteCode: string) => {
      const response = await fetch('/api/private-leagues/join-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ inviteCode }),
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

  const handleJoinByCode = async (code: string) => {
    setJoining(true)
    try {
      await joinByCodeMutation.mutateAsync(code)
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
    if (!selectedLeagueId || !confirm(`Remove ${userName} from this league?`)) return
    try {
      const response = await fetch(`/api/private-leagues/${selectedLeagueId}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to remove member')
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
      queryClient.invalidateQueries({ queryKey: ['league-details', selectedLeagueId] })
    } catch (error) {
      alert('Failed to remove member')
    }
  }

  const isCreator = (league: League) => {
    return league.createdByUserId === currentUserId
  }

  // Calculate counts for tabs
  const createdCount = useMemo(() => leagues.filter(l => isCreator(l)).length, [leagues, currentUserId])
  const joinedCount = useMemo(() => leagues.filter(l => !isCreator(l)).length, [leagues, currentUserId])

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
              subtitle={userName ? `G'day ${userName}!` : 'Create, join & administrate your private leagues'}
              centered
              maxWidth="4xl"
            />
            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <LazyLeagueRequestsNotification />
              <button
                onClick={() => setShowJoinByCodeModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-full font-medium transition-colors border border-gray-200 dark:border-gray-700"
              >
                <KeyRound className="w-4 h-4" />
                Join by Code
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Create League
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex items-center justify-center">
            <LeaguesTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              createdCount={createdCount}
              joinedCount={joinedCount}
            />
          </div>

          {/* Leagues Grid */}
          {leaguesLoading && leagues.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading leagues...</p>
            </div>
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
            <LeaguesGrid
              leagues={leagues}
              currentUserId={currentUserId}
              activeTab={activeTab}
              onCreateLeague={() => setShowCreateModal(true)}
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

