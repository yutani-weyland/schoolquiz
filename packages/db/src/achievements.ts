import { prisma } from './client'

export type UserTier = 'visitor' | 'free' | 'premium'

/**
 * Check if a user can earn a specific achievement based on their tier
 */
export function canEarnAchievement(tier: UserTier, achievement: { isPremiumOnly: boolean }): boolean {
  if (!achievement.isPremiumOnly) {
    return tier === 'free' || tier === 'premium'
  }
  return tier === 'premium'
}

/**
 * Get user tier from user record
 */
export function getUserTier(user: {
  tier: string
  subscriptionStatus: string
  freeTrialUntil?: Date | null
}): UserTier {
  if (!user) return 'visitor'
  
  const isPremium =
    user.tier === 'premium' ||
    user.subscriptionStatus === 'ACTIVE' ||
    user.subscriptionStatus === 'TRIALING' ||
    (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
  
  return isPremium ? 'premium' : 'free'
}

interface QuizCompletionData {
  userId: string
  quizId?: string
  quizSlug: string
  score: number
  totalQuestions: number
  categories?: string[] // Category names or IDs
  completionTimeSeconds?: number
  playedAt: Date
  roundScores?: Array<{
    roundNumber: number
    category: string
    score: number
    totalQuestions: number
    timeSeconds?: number
  }>
}

interface UnlockedAchievement {
  achievementId: string
  achievementSlug: string
  quizSlug: string
  progressValue?: number
  progressMax?: number
  meta?: Record<string, any>
}

/**
 * Evaluate and award achievements for a quiz completion
 */
export async function evaluateAndAwardAchievementsForQuiz(
  data: QuizCompletionData
): Promise<UnlockedAchievement[]> {
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    include: {
      quizCompletions: {
        orderBy: { completedAt: 'desc' },
        take: 100, // For streak/engagement checks
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const tier = getUserTier(user)
  const newlyUnlocked: UnlockedAchievement[] = []

  // Get all achievements that could potentially be unlocked
  const allAchievements = await prisma.achievement.findMany({
    where: {
      OR: [
        { isPremiumOnly: false }, // Free achievements
        ...(tier === 'premium' ? [{ isPremiumOnly: true }] : []), // Premium achievements if user is premium
      ],
    },
  })

  // Get user's existing achievements to avoid duplicates
  const existingAchievements = await prisma.userAchievement.findMany({
    where: { userId: data.userId },
    select: { achievementId: true },
  })
  const existingAchievementIds = new Set(existingAchievements.map((a) => a.achievementId))

  // Get quiz info if available
  let quizPublicationDate: Date | null = null
  if (data.quizSlug) {
    // Try to find quiz by slug (you may need to adjust this based on your Quiz model)
    // For now, we'll use the playedAt date as a proxy
    quizPublicationDate = data.playedAt
  }

  // Evaluate each achievement
  for (const achievement of allAchievements) {
    // Skip if already unlocked
    if (existingAchievementIds.has(achievement.id)) {
      continue
    }

    // Skip if user can't earn it
    if (!canEarnAchievement(tier, achievement)) {
      continue
    }

    const config = achievement.unlockConditionConfig
      ? JSON.parse(achievement.unlockConditionConfig)
      : {}

    let shouldUnlock = false
    let progressValue: number | undefined
    let progressMax: number | undefined
    let meta: Record<string, any> = {}

    switch (achievement.unlockConditionType) {
      case 'score_5_of_5': {
        // Perfect score in a specific category/round
        if (data.roundScores) {
          const targetCategory = config.category?.toLowerCase()
          for (const roundScore of data.roundScores) {
            const roundCategory = roundScore.category?.toLowerCase()
            if (
              (!targetCategory || roundCategory === targetCategory) &&
              roundScore.score === roundScore.totalQuestions &&
              roundScore.totalQuestions >= (config.requiredScore || 5)
            ) {
              shouldUnlock = true
              meta = { roundNumber: roundScore.roundNumber, category: roundScore.category }
              break
            }
          }
        } else if (data.score === data.totalQuestions && data.totalQuestions >= (config.requiredScore || 5)) {
          // Fallback: perfect quiz score
          shouldUnlock = true
        }
        break
      }

      case 'play_n_quizzes': {
        // Play N quizzes in a time window
        const count = config.count || 3
        const timeWindow = config.timeWindow || 'day'
        const now = data.playedAt

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

        const recentCompletions = user.quizCompletions.filter(
          (c) => new Date(c.completedAt) >= startDate && new Date(c.completedAt) <= now
        )

        // Include current completion
        const totalCount = recentCompletions.length + 1

        if (totalCount >= count) {
          shouldUnlock = true
          progressValue = totalCount
          progressMax = count
        }
        break
      }

      case 'time_window': {
        // Complete a quiz from N weeks ago
        const weeksAgo = config.weeksAgo || 3
        const quizAge = (Date.now() - (quizPublicationDate?.getTime() || data.playedAt.getTime())) / (1000 * 60 * 60 * 24 * 7)

        if (quizAge >= weeksAgo) {
          shouldUnlock = true
          meta = { weeksAgo: Math.floor(quizAge) }
        }
        break
      }

      case 'repeat_quiz': {
        // Complete the same quiz multiple times
        const minCompletions = config.minCompletions || 2
        const sameQuizCompletions = user.quizCompletions.filter((c) => c.quizSlug === data.quizSlug)

        // Include current completion
        const totalCompletions = sameQuizCompletions.length + 1

        if (totalCompletions >= minCompletions) {
          shouldUnlock = true
          progressValue = totalCompletions
          progressMax = minCompletions
        }
        break
      }

      case 'time_limit': {
        // Complete a round/quiz within a time limit
        const maxSeconds = config.maxSeconds || 120
        const targetCategory = config.category?.toLowerCase()

        if (data.roundScores) {
          for (const roundScore of data.roundScores) {
            const roundCategory = roundScore.category?.toLowerCase()
            if (
              (!targetCategory || roundCategory === targetCategory) &&
              roundScore.timeSeconds &&
              roundScore.timeSeconds <= maxSeconds
            ) {
              shouldUnlock = true
              meta = { roundNumber: roundScore.roundNumber, timeSeconds: roundScore.timeSeconds }
              break
            }
          }
        } else if (data.completionTimeSeconds && data.completionTimeSeconds <= maxSeconds) {
          shouldUnlock = true
          meta = { timeSeconds: data.completionTimeSeconds }
        }
        break
      }

      case 'streak': {
        // Maintain a streak of N weeks
        const requiredWeeks = config.weeks || 4
        // This would need more complex logic to calculate weekly streaks
        // For now, we'll check if user has played consistently
        const recentCompletions = user.quizCompletions.slice(0, requiredWeeks)
        const weeksWithQuizzes = new Set<string>()

        for (const completion of recentCompletions) {
          const weekKey = getWeekKey(new Date(completion.completedAt))
          weeksWithQuizzes.add(weekKey)
        }

        const currentWeekKey = getWeekKey(data.playedAt)
        weeksWithQuizzes.add(currentWeekKey)

        if (weeksWithQuizzes.size >= requiredWeeks) {
          shouldUnlock = true
          progressValue = weeksWithQuizzes.size
          progressMax = requiredWeeks
        }
        break
      }

      case 'event_round': {
        // Participate in an event round
        const eventTag = config.eventTag
        if (achievement.seasonTag && achievement.seasonTag.includes(eventTag)) {
          shouldUnlock = true
          meta = { eventTag }
        }
        break
      }

      default:
        // Unknown condition type - skip
        break
    }

    if (shouldUnlock) {
      // Award the achievement
      await prisma.userAchievement.create({
        data: {
          userId: data.userId,
          achievementId: achievement.id,
          quizSlug: data.quizSlug,
          progressValue,
          progressMax,
          meta: Object.keys(meta).length > 0 ? JSON.stringify(meta) : null,
        },
      })

      newlyUnlocked.push({
        achievementId: achievement.id,
        achievementSlug: achievement.slug,
        quizSlug: data.quizSlug,
        progressValue,
        progressMax,
        meta,
      })
    }
  }

  return newlyUnlocked
}

/**
 * Helper to get a week key for streak tracking (ISO week format)
 */
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

/**
 * Retro-unlock achievements when a user upgrades to Premium
 */
export async function retroUnlockAchievementsOnUpgrade(userId: string): Promise<UnlockedAchievement[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      quizCompletions: {
        orderBy: { completedAt: 'desc' },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const tier = getUserTier(user)
  if (tier !== 'premium') {
    return [] // Only retro-unlock for premium users
  }

  const newlyUnlocked: UnlockedAchievement[] = []

  // Get all premium-only achievements
  const premiumAchievements = await prisma.achievement.findMany({
    where: { isPremiumOnly: true },
  })

  // Get user's existing achievements
  const existingAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  })
  const existingAchievementIds = new Set(existingAchievements.map((a) => a.achievementId))

  // For each premium achievement, check if user would have earned it
  // This is a simplified version - you may want to re-run the full evaluation logic
  for (const achievement of premiumAchievements) {
    if (existingAchievementIds.has(achievement.id)) {
      continue
    }

    // Re-evaluate based on quiz history
    // This is simplified - you'd want to call evaluateAndAwardAchievementsForQuiz
    // for each historical completion, but that could be expensive
    // For now, we'll just unlock achievements that don't require specific quiz data
    const config = achievement.unlockConditionConfig
      ? JSON.parse(achievement.unlockConditionConfig)
      : {}

    // Only auto-unlock simple achievements (like subscription-based ones)
    if (achievement.unlockConditionType === 'subscription') {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          meta: JSON.stringify({ retroUnlocked: true }),
        },
      })

      newlyUnlocked.push({
        achievementId: achievement.id,
        achievementSlug: achievement.slug,
        quizSlug: '',
        meta: { retroUnlocked: true },
      })
    }
  }

  return newlyUnlocked
}

