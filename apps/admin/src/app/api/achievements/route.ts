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
  try {
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

    // Fetch user from database with error handling
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })
      return user
    } catch (dbError: any) {
      console.error('[Achievements API] Database error fetching user:', dbError)
      // Return null if database error - we'll handle it gracefully
      return null
    }
  } catch (error: any) {
    console.error('[Achievements API] Error in getUserFromToken:', error)
    return null
  }
}

/**
 * GET /api/achievements
 * Get all achievements with user's unlock status
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Achievements API] Starting request...')
    const user = await getUserFromToken(request)
    const tier = user ? getUserTier(user) : 'visitor'
    console.log('[Achievements API] User tier:', tier)
    
    // Get all achievements - handle case where table doesn't exist yet
    let allAchievements: any[] = []
    try {
      allAchievements = await (prisma as any).achievement.findMany({
        orderBy: [
          { rarity: 'asc' }, // Legendary first
          { name: 'asc' },
        ],
      })
      console.log('[Achievements API] Found achievements:', allAchievements.length)
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
      
      // Helper function to get week key for streak tracking
      function getWeekKey(date: Date): string {
        const d = new Date(date)
        d.setHours(0, 0, 0, 0)
        d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
        const week1 = new Date(d.getFullYear(), 0, 4)
        return (
          d.getFullYear() +
          '-' +
          String(Math.ceil(((d.getTime() - week1.getTime()) / 86400000 + 1) / 7)).padStart(2, '0')
        )
      }

      // Calculate progress for achievements based on unlock conditions
      // Note: Progress-based achievements should already have progress in userAchievements
      // This is a fallback to calculate progress for achievements that don't have a UserAchievement record yet
      try {
        // Get all quiz completions for the user
        let quizCompletions: any[] = []
        try {
          quizCompletions = await prisma.quizCompletion.findMany({
            where: { userId: user.id },
            orderBy: { completedAt: 'desc' },
          })
        } catch (e) {
          // QuizCompletion table might not exist
        }

        for (const achievement of allAchievements) {
          const achievementId = achievement.id
          const isUnlocked = userAchievements.some((ua) => ua.achievementId === achievementId)
          
          // Skip if already unlocked or already has progress in userAchievements
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
          
          // Progress-based achievement types
          const progressBasedTypes = [
            'play_n_quizzes',
            'play_n_quizzes_total',
            'perfect_scores_total',
            'streak',
            'repeat_quiz',
          ]

          if (!progressBasedTypes.includes(conditionType)) {
            continue // Skip non-progress-based achievements
          }

          try {
            if (conditionType === 'play_n_quizzes_total') {
              // Count total completed quizzes (no time window)
              progressValue = quizCompletions.length
              progressMax = conditionConfig.count || 50
            } else if (conditionType === 'play_n_quizzes') {
              // Count completed quizzes in time window
              const count = conditionConfig.count || 3
              const timeWindow = conditionConfig.timeWindow || 'day'
              const now = new Date()
              
              let startDate: Date
              if (timeWindow === 'day') {
                startDate = new Date(now)
                startDate.setHours(0, 0, 0, 0)
              } else if (timeWindow === 'week') {
                startDate = new Date(now)
                startDate.setDate(now.getDate() - 7)
              } else {
                startDate = new Date(now)
                startDate.setDate(now.getDate() - 30)
              }
              
              const recentCompletions = quizCompletions.filter(
                (c) => new Date(c.completedAt) >= startDate && new Date(c.completedAt) <= now
              )
              progressValue = recentCompletions.length
              progressMax = count
            } else if (conditionType === 'perfect_scores_total') {
              // Count total perfect scores
              const minQuestions = conditionConfig.minQuestions || 5
              const perfectScores = quizCompletions.filter(
                (c) => c.score === c.totalQuestions && c.totalQuestions >= minQuestions
              ).length
              progressValue = perfectScores
              progressMax = conditionConfig.count || 10
            } else if (conditionType === 'repeat_quiz') {
              // Count repeats for a specific quiz (can't calculate without quiz context)
              // Skip for now - this needs to be calculated per quiz
              continue
            } else if (conditionType === 'streak') {
              // Calculate streak weeks
              const requiredWeeks = conditionConfig.weeks || 4
              const weeksWithQuizzes = new Set<string>()
              
              for (const completion of quizCompletions.slice(0, requiredWeeks * 2)) {
                const weekKey = getWeekKey(new Date(completion.completedAt))
                weeksWithQuizzes.add(weekKey)
              }
              
              progressValue = weeksWithQuizzes.size
              progressMax = requiredWeeks
            }
            
            // Only add progress if there's actual progress
            if (progressValue > 0 && progressMax > 0) {
              userProgress.set(achievementId, {
                progressValue: Math.min(progressValue, progressMax),
                progressMax,
              })
            }
          } catch (e) {
            // Skip this achievement if calculation fails
            console.warn(`Error calculating progress for achievement ${achievementId}:`, e)
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
      const userAchievement = userAchievements.find((ua) => ua.achievementId === achievement.id)
      const isUnlocked = unlockedAchievementIds.has(achievement.id)
      const canEarn = !achievement.isPremiumOnly || tier === 'premium'
      
      // Get progress from userAchievements first (most accurate), then from calculated progress
      let progress = userProgress.get(achievement.id)
      if (userAchievement && userAchievement.progressValue !== null && userAchievement.progressValue !== undefined) {
        progress = {
          progressValue: userAchievement.progressValue,
          progressMax: userAchievement.progressMax || 0,
        }
      }
      
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
        unlockedAt: isUnlocked && userAchievement
          ? userAchievement.unlockedAt.toISOString()
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
    console.error('[Achievements API] Error fetching achievements:', error)
    console.error('[Achievements API] Error stack:', error.stack)
    console.error('[Achievements API] Error name:', error.name)
    
    // Return empty achievements array if database is unavailable
    if (error.message?.includes('connect') || error.message?.includes('P1001') || error.code === 'P1001') {
      console.warn('[Achievements API] Database unavailable, returning empty achievements')
      return NextResponse.json({
        achievements: [],
        tier: 'visitor',
        message: 'Database temporarily unavailable',
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch achievements', details: error.message },
      { status: 500 }
    )
  }
}

