'use client'

import { motion } from 'framer-motion'
import { Trophy, Users2, User, Medal } from 'lucide-react'
import type { LeagueStats } from '@/lib/leagues-fetch'

interface LeagueLeaderboardProps {
  stats: LeagueStats[]
  quizSlug?: string | null
  currentUserId?: string | null
  currentTeamId?: string | null
}

export function LeagueLeaderboard({
  stats,
  quizSlug,
  currentUserId,
  currentTeamId,
}: LeagueLeaderboardProps) {
  // Sort stats by score (for quiz-specific) or totalCorrectAnswers (for overall)
  const sortedStats = [...stats].sort((a, b) => {
    if (quizSlug) {
      // Quiz-specific: sort by score, then by completion time
      const scoreA = a.score || 0
      const scoreB = b.score || 0
      if (scoreB !== scoreA) return scoreB - scoreA
      const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0
      return timeA - timeB // Earlier completion = better rank
    } else {
      // Overall: sort by totalCorrectAnswers, then bestStreak
      if (b.totalCorrectAnswers !== a.totalCorrectAnswers) {
        return b.totalCorrectAnswers - a.totalCorrectAnswers
      }
      return b.bestStreak - a.bestStreak
    }
  })

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return null
  }

  const getDisplayName = (stat: LeagueStats) => {
    if (stat.team) {
      return stat.team.name
    }
    if (stat.user) {
      return stat.user.name || stat.user.email?.split('@')[0] || 'Unknown'
    }
    return 'Unknown'
  }

  const getDisplayType = (stat: LeagueStats) => {
    if (stat.team) return 'team'
    if (stat.user) return 'user'
    return 'unknown'
  }

  const isCurrentEntry = (stat: LeagueStats) => {
    if (stat.team && currentTeamId) {
      return stat.team.id === currentTeamId
    }
    if (stat.user && currentUserId) {
      return stat.user.id === currentUserId
    }
    return false
  }

  if (sortedStats.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-600 dark:text-gray-400">No stats yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Complete quizzes to see rankings
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sortedStats.map((stat, index) => {
        const rank = index + 1
        const isTeam = stat.team !== null
        const isCurrent = isCurrentEntry(stat)
        const displayName = getDisplayName(stat)
        const rankIcon = getRankIcon(rank)

        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              isCurrent
                ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/20'
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
            }`}
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-12 flex-shrink-0">
              {rankIcon || (
                <span className={`text-lg font-bold ${
                  rank <= 3 
                    ? 'text-gray-900 dark:text-white' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {rank}
                </span>
              )}
            </div>

            {/* Avatar/Icon */}
            <div className="flex-shrink-0">
              {isTeam ? (
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white text-sm ${
                    stat.team?.color ? '' : 'bg-primary'
                  }`}
                  style={stat.team?.color ? { backgroundColor: stat.team.color } : {}}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-semibold text-gray-700 dark:text-gray-300 text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name and Type */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold truncate ${
                  isCurrent 
                    ? 'text-primary' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {displayName}
                </span>
                {isTeam ? (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    <Users2 className="w-3 h-3" />
                    Team
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                    <User className="w-3 h-3" />
                    Individual
                  </span>
                )}
                {isCurrent && (
                  <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                    You
                  </span>
                )}
              </div>
              {isTeam && stat.team?.user && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Owned by {stat.team.user.name || 'Unknown'}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="text-right flex-shrink-0">
              {quizSlug ? (
                <>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {stat.score || 0}/{stat.totalQuestions || 0}
                  </div>
                  {stat.completedAt && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(stat.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {stat.totalCorrectAnswers}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.quizzesPlayed} {stat.quizzesPlayed === 1 ? 'quiz' : 'quizzes'}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
