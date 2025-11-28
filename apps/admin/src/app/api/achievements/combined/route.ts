import { NextRequest, NextResponse } from 'next/server'
import { prisma, getUserTier } from '@schoolquiz/db'
import { unstable_cache } from 'next/cache'
import { getApiUser } from '@/lib/api-auth'

// Optimized function to fetch both user achievements and all achievements in one go
// Only fetches fields needed for display to reduce data transfer
async function getCombinedAchievementsUncached(userId: string | null, tier: 'visitor' | 'free' | 'premium') {
  try {
    // Fetch both in parallel
    const [userAchievementsResult, allAchievementsResult] = await Promise.all([
      // User achievements - only fetch what we need
      userId ? prisma.userAchievement.findMany({
        where: { userId },
        select: {
          id: true,
          achievementId: true,
          quizSlug: true,
          progressValue: true,
          progressMax: true,
          unlockedAt: true,
          meta: true,
          achievement: {
            select: {
              slug: true,
              name: true,
              shortDescription: true,
              rarity: true,
              category: true,
              iconKey: true,
            },
          },
        },
        orderBy: { unlockedAt: 'desc' },
      }) : Promise.resolve([]),
      
      // All achievements - get from cache helper
      (async () => {
        const { getAllAchievements } = await import('@/lib/cache-helpers')
        return getAllAchievements()
      })(),
    ])

    // Get user progress map
    const userProgress = new Map<string, { progressValue: number; progressMax: number }>()
    const unlockedAchievementIds = new Set<string>()
    
    userAchievementsResult.forEach((ua) => {
      if (ua.achievementId) {
        unlockedAchievementIds.add(ua.achievementId)
        if (ua.progressValue !== null && ua.progressValue !== undefined && 
            ua.progressMax !== null && ua.progressMax !== undefined) {
          userProgress.set(ua.achievementId, {
            progressValue: ua.progressValue,
            progressMax: ua.progressMax,
          })
        }
      }
    })

    // Transform user achievements (only fields needed for display)
    const userAchievements = userAchievementsResult.map((ua) => ({
      id: ua.id,
      achievementId: ua.achievementId,
      achievementSlug: ua.achievement.slug,
      achievementName: ua.achievement.name,
      achievementDescription: ua.achievement.shortDescription,
      achievementRarity: ua.achievement.rarity,
      achievementCategory: ua.achievement.category,
      achievementIconKey: ua.achievement.iconKey,
      quizSlug: ua.quizSlug,
      progressValue: ua.progressValue,
      progressMax: ua.progressMax,
      unlockedAt: ua.unlockedAt.toISOString(),
      meta: ua.meta ? JSON.parse(ua.meta) : null,
    }))

    // Transform all achievements with status (only fields needed)
    const achievementsWithStatus = allAchievementsResult.map((achievement: any) => {
      const isUnlocked = unlockedAchievementIds.has(achievement.id)
      const canEarn = !achievement.isPremiumOnly || tier === 'premium'
      const progress = userProgress.get(achievement.id)

      return {
        id: achievement.id,
        slug: achievement.slug,
        name: achievement.name,
        shortDescription: achievement.shortDescription,
        category: achievement.category,
        rarity: achievement.rarity,
        isPremiumOnly: achievement.isPremiumOnly,
        iconKey: achievement.iconKey,
        status: isUnlocked
          ? 'unlocked'
          : !canEarn
          ? 'locked_premium'
          : 'locked_free',
        progressValue: progress?.progressValue,
        progressMax: progress?.progressMax,
      }
    })

    return {
      userAchievements,
      allAchievements: achievementsWithStatus,
      tier,
    }
  } catch (error: any) {
    console.error('[Combined Achievements API] Error:', error)
    // Return empty arrays on error
    return {
      userAchievements: [],
      allAchievements: [],
      tier,
    }
  }
}

/**
 * GET /api/achievements/combined
 * Get both user achievements and all achievements in a single request
 * OPTIMIZED: Only fetches fields needed for display, cached for 3 minutes
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    const tier = user ? getUserTier(user) : 'visitor'
    const userId = user?.id || null
    
    // Cache for 3 minutes (180 seconds) - achievements don't change frequently
    const cacheKey = userId || 'anonymous'
    const getCachedCombined = unstable_cache(
      async (uid: string | null, t: 'visitor' | 'free' | 'premium') => 
        getCombinedAchievementsUncached(uid, t),
      [`achievements-combined-${cacheKey}`],
      { 
        revalidate: 180, // Cache for 3 minutes
        tags: [`achievements-combined-${cacheKey}`]
      }
    )

    const data = await getCachedCombined(userId, tier)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[Combined Achievements API] Error:', error)
    
    // Return empty arrays on error to prevent UI breakage
    return NextResponse.json({
      userAchievements: [],
      allAchievements: [],
      tier: 'visitor',
    })
  }
}

