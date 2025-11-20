import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'

/**
 * GET /api/admin/achievements/stats
 * Get statistics for all achievements (user percentages, free/premium distribution)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total user count
    const totalUsers = await prisma.user.count({
      where: {
        // Only count non-visitor users
        tier: { not: 'visitor' },
      },
    })

    // Get all achievements
    const achievements = await prisma.achievement.findMany({
      select: {
        id: true,
      },
    })

    // Get user achievements with user tier information
    const userAchievements = await prisma.userAchievement.findMany({
      include: {
        user: {
          select: {
            id: true,
            tier: true,
            subscriptionStatus: true,
            freeTrialUntil: true,
          },
        },
      },
    })

    // Helper function to determine if user is premium
    const isPremiumUser = (user: {
      tier: string
      subscriptionStatus: string
      freeTrialUntil?: Date | null
    }): boolean => {
      return (
        user.tier === 'premium' ||
        user.subscriptionStatus === 'ACTIVE' ||
        user.subscriptionStatus === 'TRIALING' ||
        !!(user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
      )
    }

    // Calculate statistics for each achievement
    const statsMap = new Map<
      string,
      {
        totalUnlocked: number
        freeUnlocked: number
        premiumUnlocked: number
        percentOfUsers: number
        freePercent: number
        premiumPercent: number
      }
    >()

    // Initialize all achievements with zero stats
    achievements.forEach((achievement) => {
      statsMap.set(achievement.id, {
        totalUnlocked: 0,
        freeUnlocked: 0,
        premiumUnlocked: 0,
        percentOfUsers: 0,
        freePercent: 0,
        premiumPercent: 0,
      })
    })

    // Count unlocks by achievement
    userAchievements.forEach((ua) => {
      const achievementId = ua.achievementId || (ua as any).achievementKey
      if (!achievementId) return

      const stats = statsMap.get(achievementId)
      if (!stats) return

      stats.totalUnlocked++
      if (isPremiumUser(ua.user)) {
        stats.premiumUnlocked++
      } else {
        stats.freeUnlocked++
      }
    })

    // Calculate percentages
    const stats: Record<
      string,
      {
        totalUnlocked: number
        freeUnlocked: number
        premiumUnlocked: number
        percentOfUsers: number
        freePercent: number
        premiumPercent: number
      }
    > = {}

    statsMap.forEach((stat, achievementId) => {
      stats[achievementId] = {
        ...stat,
        percentOfUsers: totalUsers > 0 ? (stat.totalUnlocked / totalUsers) * 100 : 0,
        freePercent:
          stat.totalUnlocked > 0 ? (stat.freeUnlocked / stat.totalUnlocked) * 100 : 0,
        premiumPercent:
          stat.totalUnlocked > 0 ? (stat.premiumUnlocked / stat.totalUnlocked) * 100 : 0,
      }
    })

    return NextResponse.json({ stats, totalUsers })
  } catch (error: any) {
    console.error('Error fetching achievement statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: error.message },
      { status: 500 }
    )
  }
}

