'use client'

import { AdminOverviewClient } from './AdminOverviewClient'

interface PlatformStats {
  users: {
    total: number
    premium: number
    basic: number
    active: number
  }
  organisations: {
    total: number
    active: number
  }
  quizAttempts: {
    last30Days: number
  }
}

/**
 * Client component wrapper for StatCards
 * Receives stats as props (passed from server component)
 */
export function StatCardsWrapper({ stats }: { stats: PlatformStats | null }) {
  return <AdminOverviewClient.StatCards initialStats={stats} />
}

