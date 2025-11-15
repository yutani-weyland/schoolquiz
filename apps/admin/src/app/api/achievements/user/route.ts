import { NextRequest, NextResponse } from 'next/server'
import { prisma, getUserTier } from '@schoolquiz/db'

async function getUserFromToken(request: NextRequest) {
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
    
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: 'desc' },
    })
    
    return NextResponse.json({
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
    })
  } catch (error: any) {
    console.error('[User Achievements API] Error fetching user achievements:', error)
    console.error('[User Achievements API] Error stack:', error.stack)
    
    // Return empty array if database is unavailable
    if (error.message?.includes('connect') || error.message?.includes('P1001') || error.code === 'P1001') {
      console.warn('[User Achievements API] Database unavailable, returning empty achievements')
      return NextResponse.json({
        achievements: [],
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user achievements', details: error.message },
      { status: 500 }
    )
  }
}

