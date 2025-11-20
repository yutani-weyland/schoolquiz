import { NextRequest, NextResponse } from 'next/server'
import { prisma, getUserTier } from '@schoolquiz/db'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'

// Memoize getUserFromToken to prevent duplicate database queries in same render
const getUserFromToken = cache(async (request: NextRequest) => {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return null
    }
    
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return null
    }
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })
      return user
    } catch (dbError: any) {
      console.error('[User Achievements API] Database error fetching user:', dbError)
      return null
    }
  } catch (error: any) {
    console.error('[User Achievements API] Error in getUserFromToken:', error)
    return null
  }
})

// Cached function to fetch user achievements
async function getUserAchievementsUncached(userId: string) {
  try {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: 'desc' },
    })
    
    return {
      achievements: userAchievements.map((ua) => ({
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
      })),
    }
  } catch (dbError: any) {
    console.error('[User Achievements API] Database error in getUserAchievementsUncached:', dbError)
    // Return empty achievements if database query fails
    return { achievements: [] }
  }
}

/**
 * GET /api/achievements/user
 * Get current user's achievements with progress
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Cache user achievements for 30 seconds
    // This prevents duplicate database queries when multiple components request the same data
    const getCachedUserAchievements = unstable_cache(
      async (uid: string) => getUserAchievementsUncached(uid),
      [`user-achievements-${user.id}`],
      { 
        revalidate: 30, // Cache for 30 seconds
        tags: [`user-achievements-${user.id}`]
      }
    )

    const data = await getCachedUserAchievements(user.id)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[User Achievements API] Error fetching user achievements:', error)
    console.error('[User Achievements API] Error stack:', error.stack)
    
    // Return empty array for any error to prevent UI breakage
    // This includes database connection errors, Prisma errors, etc.
    const isDatabaseError = 
      error.message?.includes('connect') || 
      error.message?.includes('P1001') || 
      error.code === 'P1001' ||
      error.message?.includes('Prisma') ||
      error.name === 'PrismaClientInitializationError'
    
    if (isDatabaseError) {
      console.warn('[User Achievements API] Database unavailable, returning empty achievements')
    } else {
      console.warn('[User Achievements API] Unexpected error, returning empty achievements:', error.message)
    }
    
    // Always return empty achievements instead of 500 to prevent UI breakage
    return NextResponse.json({
      achievements: [],
    })
  }
}

