import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

// Import getUserTier from achievements module
function getUserTier(user: {
  tier: string
  subscriptionStatus: string
  freeTrialUntil?: Date | null
}): 'visitor' | 'free' | 'premium' {
  if (!user) return 'visitor'
  
  const isPremium =
    user.tier === 'premium' ||
    user.subscriptionStatus === 'ACTIVE' ||
    user.subscriptionStatus === 'TRIALING' ||
    (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
  
  return isPremium ? 'premium' : 'free'
}

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  // Try to get userId from custom header (sent by client)
  let userId: string | null = request.headers.get('X-User-Id')
  
  // If not in header, try to extract from mock token format: "mock-token-{userId}-{timestamp}"
  if (!userId && token.startsWith('mock-token-')) {
    const parts = token.split('-')
    if (parts.length >= 3) {
      userId = parts.slice(2, -1).join('-') // Get everything between "mock-token" and timestamp
    }
  }

  if (!userId) {
    return null
  }

  // Fetch user from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  return user
}

/**
 * GET /api/achievements
 * Get all achievements with user's unlock status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    const tier = user ? getUserTier(user) : 'visitor'
    
    // Get all achievements - handle case where table doesn't exist yet
    let allAchievements: any[] = []
    try {
      allAchievements = await (prisma as any).achievement.findMany({
        orderBy: [
          { rarity: 'asc' }, // Legendary first
          { name: 'asc' },
        ],
      })
    } catch (error: any) {
      // If achievements table doesn't exist yet, return empty array
      const errorMsg = error.message || String(error)
      if (
        errorMsg.includes('does not exist') ||
        errorMsg.includes('Unknown model') ||
        errorMsg.includes('Unknown arg') ||
        errorMsg.includes('Cannot find') ||
        errorMsg.includes('is not a function')
      ) {
        console.warn('Achievements table not found - migrations may need to be run:', errorMsg)
        return NextResponse.json({
          achievements: [],
          tier,
          message: 'Achievements table not initialized. Please run database migrations.',
        })
      }
      throw error
    }
    
    // Get user's unlocked achievements and progress if logged in
    let userAchievements: Array<{ achievementId: string; unlockedAt: Date; progressValue?: number; progressMax?: number }> = []
    let userProgress: Map<string, { progressValue: number; progressMax: number }> = new Map()
    
    if (user) {
      try {
        // Check if UserAchievement model exists and has achievementId field
        const unlocked = await prisma.userAchievement.findMany({
          where: { userId: user.id },
        })
        
        // Map to the format we need, handling both old (achievementKey) and new (achievementId) schemas
        userAchievements = unlocked.map((ua: any) => ({
          achievementId: ua.achievementId || ua.achievementKey || '',
          unlockedAt: ua.unlockedAt,
          progressValue: ua.progressValue,
          progressMax: ua.progressMax,
        })).filter((ua) => ua.achievementId) // Filter out any without an ID/key
        
        // Store progress for achievements that have progress but aren't unlocked
        userAchievements.forEach((ua) => {
          if (ua.progressValue !== null && ua.progressValue !== undefined && 
              ua.progressMax !== null && ua.progressMax !== undefined) {
            userProgress.set(ua.achievementId, {
              progressValue: ua.progressValue,
              progressMax: ua.progressMax,
            })
          }
        })
      } catch (error: any) {
        // If user_achievements table doesn't exist yet, continue with empty array
        if (error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
          console.warn('User achievements table not found')
        } else {
          throw error
        }
      }
      
      // Calculate progress for achievements based on unlock conditions
      try {
        for (const achievement of allAchievements) {
          const achievementId = achievement.id
          const isUnlocked = userAchievements.some((ua) => ua.achievementId === achievementId)
          
          // Skip if already unlocked or already has progress
          if (isUnlocked || userProgress.has(achievementId)) {
            continue
          }
          
          // Calculate progress based on unlock condition type
          const conditionType = achievement.unlockConditionType
          const conditionConfig = achievement.unlockConditionConfig 
            ? JSON.parse(achievement.unlockConditionConfig) 
            : {}
          
          let progressValue = 0
          let progressMax = 0
          
          if (conditionType === 'play_n_quizzes') {
            // Count completed quizzes
            try {
              const completedQuizzes = await prisma.quizCompletion.count({
                where: { userId: user.id },
              })
              progressValue = completedQuizzes
              progressMax = conditionConfig.count || 10
            } catch (e) {
              // QuizCompletion table might not exist
            }
          } else if (conditionType === 'score_5_of_5') {
            // Count perfect scores
            try {
              const perfectScores = await prisma.quizCompletion.count({
                where: {
                  userId: user.id,
                  score: 5,
                  totalQuestions: 5,
                },
              })
              progressValue = perfectScores
              progressMax = conditionConfig.count || 1
            } catch (e) {
              // QuizCompletion table might not exist
            }
          }
          
          // Only add progress if there's actual progress
          if (progressValue > 0 && progressMax > 0) {
            userProgress.set(achievementId, {
              progressValue: Math.min(progressValue, progressMax),
              progressMax,
            })
          }
        }
      } catch (error: any) {
        // Progress calculation errors shouldn't break the API
        console.warn('Error calculating achievement progress:', error)
      }
    }
    
    const unlockedAchievementIds = new Set(userAchievements.map((ua) => ua.achievementId))
    
    // Map achievements with status and progress
    const achievementsWithStatus = allAchievements.map((achievement: any) => {
      const isUnlocked = unlockedAchievementIds.has(achievement.id)
      const canEarn = !achievement.isPremiumOnly || tier === 'premium'
      const progress = userProgress.get(achievement.id)
      
            return {
              id: achievement.id,
              slug: achievement.slug,
              name: achievement.name,
              shortDescription: achievement.shortDescription,
              longDescription: achievement.longDescription,
              category: achievement.category,
              rarity: achievement.rarity,
              isPremiumOnly: achievement.isPremiumOnly,
              seasonTag: achievement.seasonTag,
              iconKey: achievement.iconKey,
              series: achievement.series || null,
              status: isUnlocked
                ? 'unlocked'
                : !canEarn
                ? 'locked_premium'
                : 'locked_free',
              unlockedAt: isUnlocked
                ? userAchievements.find((ua) => ua.achievementId === achievement.id)?.unlockedAt.toISOString()
                : undefined,
              progressValue: progress?.progressValue,
              progressMax: progress?.progressMax,
            }
    })
    
    return NextResponse.json({
      achievements: achievementsWithStatus,
      tier,
    })
  } catch (error: any) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements', details: error.message },
      { status: 500 }
    )
  }
}

