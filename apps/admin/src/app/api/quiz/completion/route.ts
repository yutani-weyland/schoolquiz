import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { evaluateAndAwardAchievementsForQuiz } from '@schoolquiz/db'

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
 * GET /api/quiz/completion?quizSlug=xxx
 * Get quiz completion data for the current user
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
    
    const { searchParams } = new URL(request.url)
    const quizSlug = searchParams.get('quizSlug')
    
    if (!quizSlug) {
      return NextResponse.json(
        { error: 'Missing quizSlug parameter' },
        { status: 400 }
      )
    }
    
    const completion = await prisma.quizCompletion.findUnique({
      where: {
        userId_quizSlug: {
          userId: user.id,
          quizSlug,
        },
      },
    })
    
    if (!completion) {
      return NextResponse.json({ completion: null })
    }
    
    return NextResponse.json({
      completion: {
        id: completion.id,
        quizSlug: completion.quizSlug,
        score: completion.score,
        totalQuestions: completion.totalQuestions,
        completedAt: completion.completedAt.toISOString(),
        timeSeconds: completion.timeSeconds,
      },
    })
  } catch (error: any) {
    console.error('Error fetching quiz completion:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz completion', details: error.message },
      { status: 500 }
    )
  }
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
    
    // Update private league stats
    await updatePrivateLeagueStats(user.id, quizSlug, score, totalQuestions, playedAt)
    
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

/**
 * Update private league stats for a user's quiz completion
 */
async function updatePrivateLeagueStats(
  userId: string,
  quizSlug: string,
  score: number,
  totalQuestions: number,
  completedAt: Date
) {
  // Find all leagues where user is an active member
  const userLeagues = await prisma.privateLeagueMember.findMany({
    where: {
      userId,
      leftAt: null,
    },
    select: {
      leagueId: true,
    },
  })

  if (userLeagues.length === 0) {
    return // User is not in any leagues
  }

  const leagueIds = userLeagues.map(m => m.leagueId)

  // Update stats for each league
  for (const leagueId of leagueIds) {
    // Update quiz-specific stats (only if this is a better score)
    const existingQuizStats = await prisma.privateLeagueStats.findUnique({
      where: {
        leagueId_userId_quizSlug: {
          leagueId,
          userId,
          quizSlug,
        },
      },
    })

    if (!existingQuizStats || (existingQuizStats.score || 0) < score) {
      // New quiz stats or better score
      await prisma.privateLeagueStats.upsert({
        where: {
          leagueId_userId_quizSlug: {
            leagueId,
            userId,
            quizSlug,
          },
        },
        create: {
          leagueId,
          userId,
          quizSlug,
          score,
          totalQuestions,
          completedAt,
        },
        update: {
          score,
          totalQuestions,
          completedAt,
        },
      })
    }

    // Update overall stats
    const overallStats = await prisma.privateLeagueStats.findUnique({
      where: {
        leagueId_userId_quizSlug: {
          leagueId,
          userId,
          quizSlug: null,
        },
      },
    })

    if (!overallStats) {
      // First time completing a quiz in this league
      await prisma.privateLeagueStats.create({
        data: {
          leagueId,
          userId,
          quizSlug: null,
          totalCorrectAnswers: score,
          quizzesPlayed: 1,
          bestStreak: score === totalQuestions ? 1 : 0,
          currentStreak: score === totalQuestions ? 1 : 0,
        },
      })
    } else {
      // Update existing overall stats
      const newTotalCorrect = overallStats.totalCorrectAnswers + score
      const newQuizzesPlayed = overallStats.quizzesPlayed + 1
      
      // Calculate consecutive correct answers streak
      // For now, we'll track this as consecutive perfect scores (score === totalQuestions)
      // True consecutive answers would require question-by-question tracking
      let newCurrentStreak = overallStats.currentStreak
      let newBestStreak = overallStats.bestStreak
      
      if (score === totalQuestions) {
        // Perfect score - increment streak
        newCurrentStreak = overallStats.currentStreak + 1
        newBestStreak = Math.max(overallStats.bestStreak, newCurrentStreak)
      } else {
        // Streak broken - reset to 0
        newCurrentStreak = 0
      }

      await prisma.privateLeagueStats.update({
        where: {
          leagueId_userId_quizSlug: {
            leagueId,
            userId,
            quizSlug: null,
          },
        },
        data: {
          totalCorrectAnswers: newTotalCorrect,
          quizzesPlayed: newQuizzesPlayed,
          currentStreak: newCurrentStreak,
          bestStreak: newBestStreak,
        },
      })
    }
  }
}

