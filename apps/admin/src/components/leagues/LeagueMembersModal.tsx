'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Crown, UserX, Mail, KeyRound, Copy, Check, Loader2, Search, Users2, XCircle, Trophy, ChevronDown, Link2, Star, Info } from 'lucide-react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchLeagueMembers, fetchLeagueStats } from '@/lib/leagues-fetch'
import { LeagueLeaderboard } from './LeagueLeaderboard'
import * as Tooltip from '@radix-ui/react-tooltip'
import type { League } from '@/lib/leagues-fetch'

interface LeagueMembersModalProps {
  isOpen: boolean
  onClose: () => void
  league: League | null
  isLoading?: boolean
  currentUserId: string | null
  isCreator: boolean
  onKickMember: (userId: string, userName: string) => void
  removingMemberId?: string | null
  onRemoveTeam?: (teamId: string, teamName: string) => void
  removingTeamId?: string | null
  onInvite: () => void
}

export function LeagueMembersModal({
  isOpen,
  onClose,
  league,
  isLoading: isLoadingLeague = false,
  currentUserId,
  isCreator,
  onKickMember,
  removingMemberId = null,
  onRemoveTeam,
  removingTeamId = null,
  onInvite
}: LeagueMembersModalProps) {
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'members' | 'teams' | 'leaderboard'>('members')
  const [selectedQuizSlug, setSelectedQuizSlug] = useState<string | null>(null)
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null)
  const [showCodeTooltip, setShowCodeTooltip] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [codeShimmer, setCodeShimmer] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [hasShownConfetti, setHasShownConfetti] = useState(false)
  const memberRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // OPTIMIZATION: Fetch members separately using optimized endpoint (only when modal is open)
  const { data: membersData, isLoading: loadingMembers, isFetching: fetchingMembers } = useQuery({
    queryKey: ['league-members', league?.id],
    queryFn: () => fetchLeagueMembers(league!.id, 100, 0), // Fetch up to 100 members
    enabled: isOpen && !!league?.id && activeTab === 'members',
    staleTime: 10 * 1000, // Cache for 10 seconds
  })

  // Fetch teams
  const { data: teamsData, isLoading: loadingTeams, isFetching: fetchingTeams } = useQuery({
    queryKey: ['league-teams', league?.id],
    queryFn: async () => {
      const response = await fetch(`/api/private-leagues/${league!.id}/teams?limit=100&offset=0`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch teams')
      return response.json()
    },
    enabled: isOpen && !!league?.id && activeTab === 'teams',
    staleTime: 10 * 1000,
  })

  // Fetch league stats for leaderboard
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ['league-stats', league?.id, selectedQuizSlug],
    queryFn: () => fetchLeagueStats(league!.id, selectedQuizSlug || undefined),
    enabled: isOpen && !!league?.id && activeTab === 'leaderboard',
    staleTime: 30 * 1000,
  })

  const allMembers = membersData?.members || []
  const allTeams = teamsData?.teams || []
  const memberCount = membersData?.pagination?.total || league?._count?.members || 0
  const teamCount = teamsData?.pagination?.total || league?._count?.teams || 0
  const isInitialLoad = ((loadingMembers && !membersData) || (loadingTeams && !teamsData)) || isLoadingLeague

  // Trigger confetti on first leaderboard load with stats
  useEffect(() => {
    if (activeTab === 'leaderboard' && statsData?.stats && statsData.stats.length > 0 && !hasShownConfetti) {
      setShowConfetti(true)
      setHasShownConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
    }
  }, [activeTab, statsData, hasShownConfetti])

  // Filter members by search query
  const members = useMemo(() => {
    if (!searchQuery.trim()) return allMembers
    const query = searchQuery.toLowerCase()
    return allMembers.filter((member) => {
      const name = displayName(member.user)
      return name.toLowerCase().includes(query)
    })
  }, [allMembers, searchQuery])

  // Filter teams by search query
  const teams = useMemo(() => {
    if (!searchQuery.trim()) return allTeams
    const query = searchQuery.toLowerCase()
    return allTeams.filter((leagueTeam: any) => {
      const teamName = leagueTeam.team.name.toLowerCase()
      const ownerName = leagueTeam.team.user.name?.toLowerCase() || ''
      return teamName.includes(query) || ownerName.includes(query)
    })
  }, [allTeams, searchQuery])

  // OPTIMIZATION: Simplified displayName - only name is fetched from API
  const displayName = (user: { name: string | null }) => {
    return user.name || 'Unknown'
  }

  // Format join date
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  // Keyboard shortcuts: Delete key to remove focused member
  useEffect(() => {
    if (!isOpen || !isCreator) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Delete key when a member is focused and not typing in search
      if (e.key === 'Delete' && focusedMemberId && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        const member = members.find(m => m.id === focusedMemberId)
        if (member && member.userId !== currentUserId && member.userId !== league?.createdByUserId) {
          const name = displayName(member.user)
          onKickMember(member.userId, name)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isCreator, focusedMemberId, members, currentUserId, league, onKickMember])

  const copyInviteCode = async () => {
    if (league?.inviteCode) {
      await navigator.clipboard.writeText(league.inviteCode)
      setCopied(true)
      // Trigger shimmer animation
      setCodeShimmer(true)
      setTimeout(() => setCodeShimmer(false), 600)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Get contextual invite button text
  const getInviteButtonText = () => {
    if (activeTab === 'leaderboard') {
      return 'Share league code'
    }
    if (memberCount === 0) {
      return 'Add the first member'
    }
    if (memberCount < 5) {
      return 'Invite more members'
    }
    return 'Invite Members'
  }

  const getInviteButtonIcon = () => {
    if (activeTab === 'leaderboard') {
      return Link2
    }
    return Mail
  }

  if (!league) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-700 relative">
              {/* Prominent Loading Overlay - shows when data is being fetched */}
              {isInitialLoad && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-50 rounded-3xl flex flex-col items-center justify-center"
                >
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Loading league data...
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This should only take a moment
                  </p>
                </motion.div>
              )}

              {/* Header - Improved Hierarchy with Typography Polish */}
              <div className="px-7 pt-7 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-start gap-3">
                    {/* League Color Badge */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-2.5"
                      style={{ backgroundColor: league.color || '#3B82F6' }}
                    />
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                        {league.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        <span className="font-medium">League</span>
                        <span>·</span>
                        <Tooltip.Provider delayDuration={300}>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <div className="flex items-center gap-1.5 cursor-help">
                                <Users className="w-4 h-4" />
                                <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                                {teamCount === 0 && (
                                  <Info className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                )}
                              </div>
                            </Tooltip.Trigger>
                            {teamCount === 0 && (
                              <Tooltip.Portal>
                                <Tooltip.Content
                                  className="z-50 max-w-xs rounded-lg bg-gray-900 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-white shadow-xl border border-white/10"
                                  side="bottom"
                                  sideOffset={8}
                                >
                                  Teams appear after they complete a quiz.
                                  <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
                                </Tooltip.Content>
                              </Tooltip.Portal>
                            )}
                          </Tooltip.Root>
                        </Tooltip.Provider>
                        {teamCount > 0 && (
                          <>
                            <span>·</span>
                            <div className="flex items-center gap-1.5">
                              <Users2 className="w-4 h-4" />
                              <span>{teamCount} {teamCount === 1 ? 'team' : 'teams'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Invite Code - Enhanced with Micro-Pattern */}
                    <Tooltip.Provider delayDuration={200}>
                      <Tooltip.Root open={showCodeTooltip} onOpenChange={setShowCodeTooltip}>
                        <Tooltip.Trigger asChild>
                          <motion.div
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer relative overflow-hidden"
                            onHoverStart={() => setCodeShimmer(true)}
                            onHoverEnd={() => setCodeShimmer(false)}
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.15 }}
                          >
                            {/* Subtle shimmer effect */}
                            {codeShimmer && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                initial={{ x: '-100%' }}
                                animate={{ x: '200%' }}
                                transition={{ duration: 0.6, ease: 'easeInOut' }}
                              />
                            )}
                            <KeyRound className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0 relative z-10" />
                            <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300 relative z-10">
                              {league.inviteCode}
                            </span>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyInviteCode()
                              }}
                              className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0 relative z-10"
                              whileTap={{ scale: 0.9 }}
                            >
                              <AnimatePresence mode="wait">
                                {copied ? (
                                  <motion.div
                                    key="check"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="copy"
                                    initial={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    <Copy className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          </motion.div>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="z-50 max-w-xs rounded-lg bg-gray-900 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-white shadow-xl border border-white/10"
                            side="bottom"
                            sideOffset={8}
                          >
                            Anyone with this code can join your league.
                            <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                    {(fetchingMembers || fetchingTeams || loadingStats) && !isInitialLoad && (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    )}
                    <button
                      onClick={onClose}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Close members modal"
                    >
                      <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Segmented Control Tabs - Enhanced with Size Contrast & Animation */}
                <div className="relative flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
                  {/* Animated Background Indicator */}
                  <motion.div
                    className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                    initial={false}
                    animate={{
                      x: activeTab === 'members' ? 0 : activeTab === 'teams' ? '100%' : teamCount > 0 ? '200%' : '100%',
                      width: teamCount > 0 ? 'calc(33.333% - 0.25rem)' : 'calc(50% - 0.25rem)',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                      duration: 0.2,
                    }}
                    style={{
                      height: 'calc(100% - 0.5rem)',
                    }}
                  />
                  
                  <button
                    onClick={() => {
                      setActiveTab('members')
                      setSearchQuery('')
                    }}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === 'members'
                        ? 'text-gray-900 dark:text-white scale-105'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <Users className={`w-4 h-4 transition-opacity ${activeTab === 'members' ? 'opacity-100' : 'opacity-60'}`} />
                    <span className="font-medium">Members</span>
                    <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full transition-colors ${
                      activeTab === 'members'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}>
                      {memberCount}
                    </span>
                  </button>
                  {teamCount > 0 && (
                    <button
                      onClick={() => {
                        setActiveTab('teams')
                        setSearchQuery('')
                      }}
                      className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === 'teams'
                          ? 'text-gray-900 dark:text-white scale-105'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <Users2 className={`w-4 h-4 transition-opacity ${activeTab === 'teams' ? 'opacity-100' : 'opacity-60'}`} />
                      <span className="font-medium">Teams</span>
                      <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full transition-colors ${
                        activeTab === 'teams'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                      }`}>
                        {teamCount}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setActiveTab('leaderboard')
                      setSearchQuery('')
                    }}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === 'leaderboard'
                        ? 'text-gray-900 dark:text-white scale-105'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <motion.div
                      animate={activeTab === 'leaderboard' ? {
                        scale: [1, 1.2, 1],
                      } : {}}
                      transition={{
                        duration: 0.6,
                        repeat: activeTab === 'leaderboard' ? Infinity : 0,
                        repeatDelay: 3,
                      }}
                    >
                      <Trophy className={`w-4 h-4 transition-all ${activeTab === 'leaderboard' ? 'opacity-100 text-amber-500' : 'opacity-60'}`} />
                    </motion.div>
                    <span className="font-medium">Leaderboard</span>
                  </button>
                </div>
              </div>

              {/* Tab Content with Animation */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeTab === 'leaderboard' ? (
                    <motion.div
                      key="leaderboard"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 flex flex-col overflow-hidden"
                    >
                      {/* Quiz Selector - Enhanced Dropdown */}
                      <div className="px-7 pt-4 pb-3">
                        <div className="relative">
                          <select
                            value={selectedQuizSlug || ''}
                            onChange={(e) => setSelectedQuizSlug(e.target.value || null)}
                            onFocus={() => setIsDropdownOpen(true)}
                            onBlur={() => setIsDropdownOpen(false)}
                            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm appearance-none cursor-pointer shadow-sm"
                          >
                            <option value="">Overall Leaderboard</option>
                            {statsData?.quizSlugs?.map((slug: string) => (
                              <option key={slug} value={slug}>
                                🎯 Quiz: {slug}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none transition-transform duration-200 ${
                              isDropdownOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                      {/* Leaderboard Content */}
                      <div className="flex-1 overflow-y-auto px-7 pb-4 relative">
                        {loadingStats ? (
                          // Skeleton Loading - Modern UX
                          <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse" />
                                  <div className="space-y-2">
                                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                                  </div>
                                </div>
                                <div className="h-5 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                              </motion.div>
                            ))}
                          </div>
                        ) : statsData?.stats && statsData.stats.length > 0 ? (
                          <>
                            {/* Confetti Effect for Top Spot - First Load Only */}
                            {showConfetti && (
                              <div className="fixed inset-0 pointer-events-none z-[60]">
                                {[...Array(20)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full"
                                    style={{
                                      backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181'][i % 5],
                                      left: `${50 + (Math.random() - 0.5) * 20}%`,
                                      top: '30%',
                                    }}
                                    initial={{ 
                                      y: 0, 
                                      x: 0, 
                                      opacity: 1,
                                      scale: 1 
                                    }}
                                    animate={{ 
                                      y: 400,
                                      x: (Math.random() - 0.5) * 300,
                                      opacity: 0,
                                      scale: 0.5,
                                      rotate: Math.random() * 360
                                    }}
                                    transition={{ 
                                      duration: 1.5,
                                      delay: i * 0.05,
                                      ease: 'easeOut'
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                            <LeagueLeaderboard
                              stats={selectedQuizSlug ? statsData.stats : (statsData.overallStats || statsData.stats)}
                              quizSlug={selectedQuizSlug || undefined}
                              currentUserId={currentUserId}
                              currentTeamId={null} // TODO: Get current team ID from context
                            />
                          </>
                        ) : (
                          <div className="text-center py-12">
                            {/* Trophy Icon with Dust Effect */}
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              className="relative inline-block mb-4"
                            >
                              <Trophy className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                              {/* Subtle dust particles */}
                              <div className="absolute inset-0">
                                {[...Array(3)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"
                                    initial={{ 
                                      x: 0, 
                                      y: 0, 
                                      opacity: 0.6,
                                      scale: 0 
                                    }}
                                    animate={{ 
                                      x: (Math.random() - 0.5) * 40,
                                      y: (Math.random() - 0.5) * 40,
                                      opacity: 0,
                                      scale: 1
                                    }}
                                    transition={{ 
                                      duration: 2,
                                      delay: i * 0.2,
                                      repeat: Infinity,
                                      repeatDelay: 3
                                    }}
                                    style={{
                                      left: '50%',
                                      top: '50%',
                                    }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No results yet</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Play quizzes to see your leaderboard.
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
                              Your league updates automatically when teams complete quizzes.
                            </p>
                            {/* Leaderboard Preview */}
                            <div className="max-w-md mx-auto p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
                              <div className="flex items-center gap-2 mb-3">
                                <Trophy className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Leaderboard Preview</span>
                              </div>
                              <div className="space-y-2 text-left">
                                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                  <span>1. Your Team</span>
                                  <span className="font-medium">0 pts</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-400 dark:text-gray-500">
                                  <span>2. —</span>
                                  <span>—</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-400 dark:text-gray-500">
                                  <span>3. —</span>
                                  <span>—</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : activeTab === 'members' ? (
                    <motion.div
                      key="members"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 flex flex-col overflow-hidden"
                    >
                      {/* Search - Only in Members Tab - Tightened Visual Weight */}
                      {allMembers.length > 0 && (
                        <div className="px-7 pt-4 pb-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <input
                              type="text"
                              placeholder="Search by name or team"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm shadow-inner"
                              style={{
                                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {/* Members Content */}
                      <div className="flex-1 overflow-y-auto px-7 pb-4">
                        {loadingMembers ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 mx-auto mb-4 text-gray-400 dark:text-gray-500 animate-spin" />
                      <p className="text-gray-600 dark:text-gray-400">Loading members...</p>
                    </div>
                  ) : allMembers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">No members yet</p>
                      <button
                        onClick={onInvite}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Invite Members
                      </button>
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">No members found</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Try adjusting your search</p>
                    </div>
                  ) : (
                    <>
                      {searchQuery && (
                        <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          Showing {members.length} of {allMembers.length} member{allMembers.length !== 1 ? 's' : ''}
                        </div>
                      )}
                      <AnimatePresence mode="popLayout">
                        <div className="space-y-2">
                          {members.map((member) => {
                        const isYou = member.userId === currentUserId
                        const isCreatorMember = member.userId === league.createdByUserId
                        const name = displayName(member.user)

                        return (
                          <motion.div
                            key={member.id}
                            ref={(el) => {
                              if (el) memberRefs.current.set(member.id, el)
                              else memberRefs.current.delete(member.id)
                            }}
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            tabIndex={isCreator && !isYou ? 0 : undefined}
                            onFocus={() => setFocusedMemberId(member.id)}
                            onBlur={() => {
                              // Only clear focus if focus is moving to another member
                              setTimeout(() => {
                                if (!memberRefs.current.get(member.id)?.contains(document.activeElement)) {
                                  setFocusedMemberId(null)
                                }
                              }, 0)
                            }}
                            whileHover={{ 
                              y: -2,
                              transition: { duration: 0.15 }
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                              isYou
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                            } ${
                              focusedMemberId === member.id && isCreator && !isYou
                                ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-800'
                                : ''
                            } group`}
                            role={isCreator && !isYou ? 'button' : undefined}
                            aria-label={isCreator && !isYou ? `${name} - Press Delete to remove` : undefined}
                          >
                          <div className="flex items-center gap-3">
                            {/* Avatar with League Color Ring - Hover Animation */}
                            <motion.div 
                              className="relative flex-shrink-0"
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                            >
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white text-sm"
                                style={{ backgroundColor: league.color || '#3B82F6' }}
                              >
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div
                                className="absolute -inset-0.5 rounded-full border-2 opacity-30 group-hover:opacity-50 transition-opacity"
                                style={{ borderColor: league.color || '#3B82F6' }}
                              />
                            </motion.div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {name}
                                </span>
                                {isYou && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                                    You
                                  </span>
                                )}
                                {isCreatorMember && !isYou && (
                                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-full font-medium">
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                    Creator
                                  </span>
                                )}
                                {!isCreatorMember && !isYou && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-full font-medium">
                                    Member
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Joined {formatJoinDate(member.joinedAt)}
                              </p>
                            </div>
                          </div>
                          {isCreator && !isYou && (
                            <motion.button
                              onClick={() => onKickMember(member.userId, name)}
                              disabled={removingMemberId === member.userId}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 opacity-0 group-hover:opacity-100"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title={`Remove ${name} from league`}
                              aria-label={`Remove ${name} from league`}
                            >
                              {removingMemberId === member.userId ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <UserX className="w-5 h-5" />
                              )}
                            </motion.button>
                          )}
                          </motion.div>
                        )
                        })}
                        </div>
                      </AnimatePresence>
                    </>
                  )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="teams"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 flex flex-col overflow-hidden"
                    >
                      {/* Search - Only in Teams Tab - Tightened Visual Weight */}
                      {allTeams.length > 0 && (
                        <div className="px-7 pt-4 pb-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <input
                              type="text"
                              placeholder="Search by name or team"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm shadow-inner"
                              style={{
                                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {/* Teams Content */}
                      <div className="flex-1 overflow-y-auto px-7 pb-4">
                        {loadingTeams ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 mx-auto mb-4 text-gray-400 dark:text-gray-500 animate-spin" />
                      <p className="text-gray-600 dark:text-gray-400">Loading teams...</p>
                    </div>
                  ) : allTeams.length === 0 ? (
                    <div className="text-center py-12">
                      <Users2 className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-600 dark:text-gray-400">No teams in this league</p>
                    </div>
                  ) : teams.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">No teams found</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Try adjusting your search</p>
                    </div>
                  ) : (
                    <>
                      {searchQuery && (
                        <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          Showing {teams.length} of {allTeams.length} team{allTeams.length !== 1 ? 's' : ''}
                        </div>
                      )}
                      <AnimatePresence mode="popLayout">
                        <div className="space-y-2">
                          {teams.map((leagueTeam: any) => {
                            const team = leagueTeam.team
                            const ownerName = team.user.name || 'Unknown'
                            const isOwnTeam = team.userId === currentUserId
                            return (
                              <motion.div
                                key={leagueTeam.id}
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                  isOwnTeam
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {team.color && (
                                    <div
                                      className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white text-sm flex-shrink-0"
                                      style={{ backgroundColor: team.color }}
                                    >
                                      {team.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  {!team.color && (
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white text-sm bg-primary flex-shrink-0">
                                      {team.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {team.name}
                                      </span>
                                      {isOwnTeam && (
                                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                          Your team
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      Owned by {ownerName} • Joined {formatJoinDate(leagueTeam.joinedAt)}
                                    </p>
                                  </div>
                                </div>
                                {isCreator && onRemoveTeam && (
                                  <button
                                    onClick={() => onRemoveTeam(team.id, team.name)}
                                    disabled={removingTeamId === team.id}
                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={`Remove ${team.name} from league`}
                                    aria-label={`Remove ${team.name} from league`}
                                  >
                                    {removingTeamId === team.id ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <XCircle className="w-5 h-5" />
                                    )}
                                  </button>
                                )}
                              </motion.div>
                            )
                          })}
                        </div>
                      </AnimatePresence>
                    </>
                  )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer - Contextual Invite Button (Sticky) */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-7 pt-5 pb-6 rounded-b-3xl">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {activeTab === 'members' && allMembers.length > 0 && (
                      <span>{allMembers.length} {allMembers.length === 1 ? 'member' : 'members'} total</span>
                    )}
                    {activeTab === 'leaderboard' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Your league updates automatically when teams complete quizzes.
                      </span>
                    )}
                  </div>
                  <motion.button
                    onClick={onInvite}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label={getInviteButtonText()}
                  >
                    {(() => {
                      const Icon = getInviteButtonIcon()
                      return <Icon className="w-4 h-4" />
                    })()}
                    <span>{getInviteButtonText()}</span>
                    <span className="opacity-70">→</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

