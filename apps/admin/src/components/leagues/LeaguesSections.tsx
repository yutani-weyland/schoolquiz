'use client'

import { motion } from 'framer-motion'
import { Plus, Trophy, KeyRound } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { LeagueCard } from './LeagueCard'
import { fetchLeagueDetails, fetchLeagueMembers } from '@/lib/leagues-fetch'
import type { League } from '@/lib/leagues-fetch'

interface LeaguesSectionsProps {
  leagues: League[]
  currentUserId: string | null
  onCreateLeague: () => void
  onJoinByCode: () => void
  onInvite: (leagueId: string) => void
  onManage: (leagueId: string) => void
  onViewMembers: (leagueId: string) => void
  onLeaveLeague?: (leagueId: string) => void
  onDelete?: (leagueId: string) => void
  isCreator: (league: League) => boolean
}

export function LeaguesSections({
  leagues,
  currentUserId,
  onCreateLeague,
  onJoinByCode,
  onInvite,
  onManage,
  onViewMembers,
  onLeaveLeague,
  onDelete,
  isCreator,
}: LeaguesSectionsProps) {
  const queryClient = useQueryClient()
  const prefetchedLeagues = useRef(new Set<string>())

  // OPTIMIZATION: Prefetch league data when cards come into viewport
  useEffect(() => {
    if (typeof window === 'undefined' || !leagues.length) return

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
  }, [leagues, queryClient])

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Leagues
        </h2>
          <div className="flex items-center gap-2">
          <button
            onClick={onJoinByCode}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-full font-medium transition-colors border border-gray-200 dark:border-gray-700"
          >
            <KeyRound className="w-4 h-4" />
            Join by Code
          </button>
          <button
            onClick={onCreateLeague}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create League
          </button>
        </div>
      </div>

      {leagues.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700"
        >
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No leagues yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Create your first league or join one using an invite code
          </p>
          <button
            onClick={onCreateLeague}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Create Your First League
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {leagues.map((league, index) => (
            <div key={league.id} data-league-id={league.id}>
              <LeagueCard
                league={league}
                isCreator={isCreator(league)}
                currentUserId={currentUserId}
                onInvite={onInvite}
                onManage={onManage}
                onViewMembers={onViewMembers}
                onLeaveLeague={onLeaveLeague}
                onDelete={onDelete}
                index={index}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
