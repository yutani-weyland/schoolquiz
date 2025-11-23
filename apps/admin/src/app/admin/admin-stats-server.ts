/**
 * Server-side function to fetch admin stats
 * Calls database directly (reuses logic from API route)
 * 
 * Note: This file is imported by a Server Component, so it needs to work
 * with Next.js transpilation. The @schoolquiz/db package is configured
 * to be transpiled in next.config.js.
 */

import { prisma } from '@schoolquiz/db'
import { dummyUsers } from '@/lib/dummy-data'
import { CACHE_TTL, CACHE_TAGS } from '@/lib/cache-config'
import { unstable_cache } from 'next/cache'

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
 * Internal function to fetch stats from database
 * Reuses the same logic as the API route
 */
async function getStatsInternal(): Promise<PlatformStats> {
  // Try to fetch from database first
  try {
    const [totalUsers, premiumUsers, basicUsers, totalOrgs, activeOrgs] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { tier: 'premium' } }),
      prisma.user.count({ where: { tier: 'basic' } }),
      prisma.organisation.count(),
      prisma.organisation.count({ where: { status: 'ACTIVE' } }),
    ])

    // Get quiz attempts in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const quizAttempts = await prisma.quizCompletion.count({
      where: {
        completedAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    // Get active users (logged in within last 30 days)
    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    return {
      users: {
        total: totalUsers,
        premium: premiumUsers,
        basic: basicUsers,
        active: activeUsers,
      },
      organisations: {
        total: totalOrgs,
        active: activeOrgs,
      },
      quizAttempts: {
        last30Days: quizAttempts,
      },
    }
  } catch (dbError) {
    // Fallback to dummy data if database is not available
    console.log('Database not available, using dummy data for stats')
    
    const premiumCount = dummyUsers.filter(u => u.tier === 'premium').length
    const basicCount = dummyUsers.filter(u => u.tier === 'basic').length
    
    return {
      users: {
        total: dummyUsers.length,
        premium: premiumCount,
        basic: basicCount,
        active: dummyUsers.filter(u => {
          if (!u.lastLoginAt) return false
          const lastLogin = new Date(u.lastLoginAt)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return lastLogin >= thirtyDaysAgo
        }).length,
      },
      organisations: {
        total: 4,
        active: 3,
      },
      quizAttempts: {
        last30Days: 205,
      },
    }
  }
}

/**
 * Fetch admin stats - cached for performance
 */
export async function fetchAdminStats(): Promise<PlatformStats> {
  return unstable_cache(
    getStatsInternal,
    ['admin-stats-server'],
    {
      revalidate: CACHE_TTL.STATS,
      tags: [CACHE_TAGS.STATS],
    }
  )()
}

