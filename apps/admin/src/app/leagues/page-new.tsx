'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Mail, Plus } from 'lucide-react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useUserTier } from '@/hooks/useUserTier'
import { useUserAccess } from '@/contexts/UserAccessContext'
import { UpgradeModal } from '@/components/premium/UpgradeModal'
import dynamic from 'next/dynamic'
import { Footer } from '@/components/Footer'
import { 
  fetchLeagues, 
  fetchLeagueDetails, 
  getCachedLeagues, 
  cacheLeagues, 
  type League,
  fetchLeagueRequests,
  respondToRequest,
  type LeagueRequest
} from '@/lib/leagues-fetch'
import { LeaguesGrid } from '@/components/leagues/LeaguesGrid'
import { LeagueInviteModal } from '@/components/leagues/LeagueInviteModal'
import { LeagueMembersModal } from '@/components/leagues/LeagueMembersModal'
import { CreateLeagueModal } from '@/components/leagues/CreateLeagueModal'
import { LeagueRequestsNotification } from '@/components/leagues/LeagueRequestsNotification'

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

export default function LeaguesPage() {
  const { tier, isPremium, isLoading: tierLoading } = useUserTier()
  const { userName } = useUserAccess()
  const queryClient = useQueryClient()

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [creating, setCreating] = useState(false)

  const platformRole = typeof window !== 'undefined' ? localStorage.getItem('platformRole') : null
  const isAdmin = platformRole === 'PLATFORM_ADMIN' || platformRole === 'ORG_ADMIN'
  const hasAccess = isPremium || isAdmin
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null

  // Get cached leagues for instant initial render
  const cachedLeagues = useMemo(() => getCachedLeagues(), [])

  // Fetch leagues
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
    enabled: hasAccess && !tierLoading,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    initialData: cachedLeagues || undefined,
    placeholderData: cachedLeagues || undefined,
  })

  // Fetch selected league details
  const { data: selectedLeagueDetails } = useQuery({
    queryKey: ['league-details', selectedLeagueId],
    queryFn: () => fetchLeagueDetails(selectedLeagueId!),
    enabled: !!selectedLeagueId && hasAccess,
    staleTime: 30 * 1000,
  })

  const selectedLeague = useMemo(() => {
    if (!selectedLeagueId) return null
    if (selectedLeagueDetails) return selectedLeagueDetails
    return leagues.find(l => l.id === selectedLeagueId) || null
  }, [selectedLeagueId, selectedLeagueDetails, leagues])

  // Fetch user organisation
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
    enabled: hasAccess,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch org members for invite modal
  const [orgMembers, setOrgMembers] = useState<any[]>([])
  const [loadingOrgMembers, setLoadingOrgMembers] = useState(false)

  useEffect(() => {
    if (showInviteModal && userOrg?.id && selectedLeague) {
      setLoadingOrgMembers(true)
      fetch(`/api/organisation/${userOrg.id}/members`, {
        credentials: 'include',
      })
        .then(async res => {
          if (!res.ok) return []
          const data = await res.json()
          const existingMemberIds = new Set(selectedLeague.members?.map(m => m.userId) || [])
          return (data.members || []).filter((m: any) =>
            m.user?.id !== currentUserId &&
            !existingMemberIds.has(m.user?.id) &&
            m.status === 'ACTIVE'
          )
        })
        .then(data => setOrgMembers(data))
        .catch(() => setOrgMembers([]))
        .finally(() => setLoadingOrgMembers(false))
    }
  }, [showInviteModal, userOrg?.id, selectedLeague, currentUserId])

  // Fetch league requests
  const { data: leagueRequests = [] } = useQuery({
    queryKey: ['league-requests'],
    queryFn: fetchLeagueRequests,
    enabled: hasAccess,
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
  })

  // Create league mutation
  const createLeagueMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; color: string }) => {
      const response = await fetch('/api/private-leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          organisationId: userOrg?.id,
        }),
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

  const handleCreateLeague = async (data: { name: string; description: string; color: string }) => {
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
          const member = orgMembers.find(m => m.user?.id === memberId)
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
          <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
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
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-3">
                  Private Leagues
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {userName ? `G'day ${userName}!` : 'Create and manage your private competitions'}
                </p>
              </div>
              {leagueRequests.length > 0 && (
                <LeagueRequestsNotification />
              )}
            </div>
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
              onCreateLeague={() => setShowCreateModal(true)}
              onInvite={(leagueId) => {
                setSelectedLeagueId(leagueId)
                setShowInviteModal(true)
              }}
              onManage={(leagueId) => {
                setSelectedLeagueId(leagueId)
                // TODO: Open manage modal
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

      {/* Modals */}
      <CreateLeagueModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateLeague}
        creating={creating || createLeagueMutation.isPending}
        userOrg={userOrg || null}
      />

      <LeagueInviteModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false)
          setSelectedLeagueId(null)
        }}
        league={selectedLeague}
        userOrg={userOrg || null}
        orgMembers={orgMembers}
        loadingOrgMembers={loadingOrgMembers}
        onInviteByEmail={handleInviteByEmail}
        onInviteOrgMembers={handleInviteOrgMembers}
        inviting={inviting || inviteMutation.isPending}
      />

      <LeagueMembersModal
        isOpen={showMembersModal}
        onClose={() => {
          setShowMembersModal(false)
          setSelectedLeagueId(null)
        }}
        league={selectedLeague}
        currentUserId={currentUserId}
        isCreator={selectedLeague ? isCreator(selectedLeague) : false}
        onKickMember={handleKickMember}
        onInvite={() => {
          setShowMembersModal(false)
          setShowInviteModal(true)
        }}
      />

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  )
}

