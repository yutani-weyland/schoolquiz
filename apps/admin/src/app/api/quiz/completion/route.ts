import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { evaluateAndAwardAchievementsForQuiz } from '@schoolquiz/db/achievements'

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  if (!token) {
    return null
  }
  
  const userId = request.headers.get('x-user-id')
  
  if (!userId) {
    return null
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  
  return user
}

/**
 * POST /api/quiz/completion
 * Save quiz completion and award achievements
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const {
      quizSlug,
      score,
      totalQuestions,
      completionTimeSeconds,
      roundScores, // Array of { roundNumber, category, score, totalQuestions, timeSeconds }
      categories, // Array of category names
    } = body
    
    if (!quizSlug || score === undefined || !totalQuestions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const playedAt = new Date()
    
    // Save or update quiz completion
    const completion = await prisma.quizCompletion.upsert({
      where: {
        userId_quizSlug: {
          userId: user.id,
          quizSlug,
        },
      },
      create: {
        userId: user.id,
        quizSlug,
        score,
        totalQuestions,
        completedAt: playedAt,
        timeSeconds: completionTimeSeconds || null,
      },
      update: {
        score: Math.max(score, (await prisma.quizCompletion.findUnique({
          where: {
            userId_quizSlug: {
              userId: user.id,
              quizSlug,
            },
          },
        }))?.score || 0), // Only update if score is better
        completedAt: playedAt,
        timeSeconds: completionTimeSeconds || null,
      },
    })
    
    // Evaluate and award achievements
    const newlyUnlocked = await evaluateAndAwardAchievementsForQuiz({
      userId: user.id,
      quizSlug,
      score,
      totalQuestions,
      categories: categories || [],
      completionTimeSeconds: completionTimeSeconds || undefined,
      playedAt,
      roundScores: roundScores || [],
    })
    
    // Update season stats
    await updateSeasonStats(user.id, playedAt, score, totalQuestions, newlyUnlocked.length)
    
    return NextResponse.json({
      completion: {
        id: completion.id,
        quizSlug: completion.quizSlug,
        score: completion.score,
        totalQuestions: completion.totalQuestions,
        completedAt: completion.completedAt.toISOString(),
        timeSeconds: completion.timeSeconds,
      },
      newlyUnlockedAchievements: newlyUnlocked,
    })
  } catch (error: any) {
    console.error('Error saving quiz completion:', error)
    return NextResponse.json(
      { error: 'Failed to save quiz completion', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Update season stats for a user
 */
async function updateSeasonStats(
  userId: string,
  completedAt: Date,
  score: number,
  totalQuestions: number,
  newAchievementsCount: number
) {
  // Find the season this completion falls into
  const season = await prisma.season.findFirst({
    where: {
      startDate: { lte: completedAt },
      endDate: { gte: completedAt },
    },
  })
  
  if (!season) {
    // No season found - skip stats update
    return
  }
  
  // Get or create season stats
  let seasonStats = await prisma.seasonStats.findUnique({
    where: {
      userId_seasonId: {
        userId,
        seasonId: season.id,
      },
    },
  })
  
  if (!seasonStats) {
    seasonStats = await prisma.seasonStats.create({
      data: {
        userId,
        seasonId: season.id,
        quizzesPlayed: 1,
        perfectScores: score === totalQuestions ? 1 : 0,
        averageScore: score,
        achievementsUnlocked: newAchievementsCount,
        lastPlayedAt: completedAt,
      },
    })
  } else {
    // Update existing stats
    const newQuizzesPlayed = seasonStats.quizzesPlayed + 1
    const newPerfectScores = seasonStats.perfectScores + (score === totalQuestions ? 1 : 0)
    const newAverageScore = seasonStats.averageScore
      ? ((seasonStats.averageScore * seasonStats.quizzesPlayed) + score) / newQuizzesPlayed
      : score
    
    // Calculate streak (simplified - weekly streak)
    const lastPlayed = seasonStats.lastPlayedAt
    const currentStreak = lastPlayed
      ? calculateWeeklyStreak(userId, season.id, completedAt, lastPlayed, seasonStats.currentStreakWeeks)
      : 1
    
    await prisma.seasonStats.update({
      where: {
        userId_seasonId: {
          userId,
          seasonId: season.id,
        },
      },
      data: {
        quizzesPlayed: newQuizzesPlayed,
        perfectScores: newPerfectScores,
        averageScore: newAverageScore,
        currentStreakWeeks: currentStreak,
        longestStreakWeeks: Math.max(seasonStats.longestStreakWeeks, currentStreak),
        achievementsUnlocked: seasonStats.achievementsUnlocked + newAchievementsCount,
        lastPlayedAt: completedAt,
      },
    })
  }
}

/**
 * Calculate weekly streak
 */
function calculateWeeklyStreak(
  userId: string,
  seasonId: string,
  currentDate: Date,
  lastPlayedDate: Date,
  currentStreak: number
): number {
  // Get the week number for both dates
  const currentWeek = getWeekNumber(currentDate)
  const lastWeek = getWeekNumber(lastPlayedDate)
  
  // If same week, keep streak
  if (currentWeek === lastWeek) {
    return currentStreak
  }
  
  // If consecutive weeks, increment streak
  if (currentWeek === lastWeek + 1) {
    return currentStreak + 1
  }
  
  // Streak broken, reset to 1
  return 1
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return Math.ceil(((d.getTime() - week1.getTime()) / 86400000 + 1) / 7)
}

