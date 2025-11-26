'use client'

import { motion } from 'framer-motion'
import { Plus, Trophy } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { LeagueCard } from './LeagueCard'
import { fetchLeagueDetails, fetchLeagueMembers } from '@/lib/leagues-fetch'
import type { League } from '@/lib/leagues-fetch'
import type { LeagueTab } from './LeaguesTabs'

interface LeaguesGridProps {
  leagues: League[]
  currentUserId: string | null
  activeTab: LeagueTab
  onCreateLeague: () => void
  onInvite: (leagueId: string) => void
  onManage: (leagueId: string) => void
  onViewMembers: (leagueId: string) => void
  isCreator: (league: League) => boolean
}

export function LeaguesGrid({
  leagues,
  currentUserId,
  activeTab,
  onCreateLeague,
  onInvite,
  onManage,
  onViewMembers,
  isCreator
}: LeaguesGridProps) {
  const queryClient = useQueryClient()
  const prefetchedLeagues = useRef(new Set<string>())
  
  // Separate created and joined leagues
  const createdLeagues = leagues.filter(l => isCreator(l))
  const joinedLeagues = leagues.filter(l => !isCreator(l))
  
  // Filter leagues based on active tab
  const displayedLeagues = activeTab === 'created' ? createdLeagues : joinedLeagues

  // OPTIMIZATION: Prefetch league data when cards come into viewport
  useEffect(() => {
    if (typeof window === 'undefined' || !displayedLeagues.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const leagueId = entry.target.getAttribute('data-league-id')
            if (leagueId && !prefetchedLeagues.current.has(leagueId)) {
              prefetchedLeagues.current.add(leagueId)
              
              // Prefetch league details (lightweight)
              queryClient.prefetchQuery({
                queryKey: ['league-details', leagueId],
                queryFn: () => fetchLeagueDetails(leagueId, false),
                staleTime: 30 * 1000,
              })
              
              // Prefetch members (for members modal)
              queryClient.prefetchQuery({
                queryKey: ['league-members', leagueId],
                queryFn: () => fetchLeagueMembers(leagueId, 50, 0),
                staleTime: 10 * 1000,
              })
            }
          }
        })
      },
      {
        rootMargin: '200px', // Start prefetching 200px before card is visible
      }
    )

    // Observe all league cards
    const cards = document.querySelectorAll('[data-league-id]')
    cards.forEach((card) => observer.observe(card))

    return () => {
      cards.forEach((card) => observer.unobserve(card))
      observer.disconnect()
    }
  }, [displayedLeagues, queryClient])

  if (displayedLeagues.length === 0) {
    return (
      <div className="text-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Trophy className="w-20 h-20 mx-auto mb-6 text-gray-300 dark:text-gray-600" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {activeTab === 'created' ? 'No leagues created yet' : 'No leagues joined yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {activeTab === 'created' 
              ? 'Create your first league to start competing with friends and colleagues'
              : 'Join a league using an invite code or wait for an invitation'}
          </p>
          {activeTab === 'created' && (
            <button
              onClick={onCreateLeague}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Create Your First League
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {displayedLeagues.map((league, index) => (
        <div key={league.id} data-league-id={league.id}>
          <LeagueCard
            league={league}
            isCreator={isCreator(league)}
            currentUserId={currentUserId}
            onInvite={onInvite}
            onManage={onManage}
            onViewMembers={onViewMembers}
            index={index}
          />
        </div>
      ))}
    </div>
  )
}

