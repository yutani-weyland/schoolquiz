import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'

import { unstable_cache } from 'next/cache'
import { CACHE_TTL, CACHE_TAGS } from '@/lib/cache-config'

/**
 * Internal function to fetch stats from database
 */
async function getStatsInternal() {
  // Fetch from database
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
}

/**
 * GET /api/admin/stats
 * Get platform statistics (admin only)
 * Cached for 15 seconds to balance freshness and performance
 */
export async function GET(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Add proper admin role check

    // Use cached stats with short TTL for real-time feel
    const stats = await unstable_cache(
      async () => getStatsInternal(),
      ['admin-stats'],
      {
        revalidate: CACHE_TTL.STATS,
        tags: [CACHE_TAGS.STATS],
      }
    )()

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    console.error('Error stack:', error.stack)

    // Ensure we always return JSON, never HTML
    try {
      return NextResponse.json(
        {
          error: 'Failed to fetch stats',
          details: error?.message || 'Unknown error',
          type: error?.name || 'Error'
        },
        { status: 500 }
      )
    } catch (jsonError) {
      // If even JSON serialization fails, return a simple error
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}



