import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

async function getUserFromToken(request: NextRequest) {
  try {
    // Commented out for prototyping - database calls disabled
    // const authHeader = request.headers.get('authorization')
    // const token = authHeader?.replace('Bearer ', '')
    // 
    // if (!token) {
    //   return null
    // }
    // 
    // const userId = request.headers.get('x-user-id')
    // 
    // if (!userId) {
    //   return null
    // }
    // 
    // console.log('[Stats API] Looking up user:', userId)
    // const { prisma } = await import('@schoolquiz/db')
    // const user = await prisma.user.findUnique({
    //   where: { id: userId },
    // })
    // 
    // if (!user) {
    //   console.log('[Stats API] User not found in database:', userId)
    // }
    // 
    // return user
    return null
  } catch (error: any) {
    console.error('[Stats API] Error in getUserFromToken:', error)
    return null
  }
}

/**
 * GET /api/stats
 * Get comprehensive stats for the current user
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Stats API] Starting stats fetch...')
    
    // Get headers for auth check
    const userId = request.headers.get('x-user-id')
    const authHeader = request.headers.get('authorization')
    
    // Check if user is authenticated (has userId and token)
    if (!userId || !authHeader) {
      console.log('[Stats API] No auth headers - unauthorized')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // For prototyping: Return empty/mock stats without database calls
    // This allows the stats page to render even if database is unavailable
    console.log('[Stats API] Returning empty stats for prototyping (userId:', userId, ')')
    
    return NextResponse.json({
      summary: {
        averageScore: 0,
        totalQuestionsAttempted: 0,
        totalQuizzesPlayed: 0,
        totalCorrectAnswers: 0,
        perfectScores: 0,
      },
      streaks: {
        currentQuestionStreak: 0,
        bestQuestionStreak: 0,
        currentQuizStreak: 0,
        bestQuizStreak: 0,
      },
      categories: {
        strongest: [],
        weakest: [],
        all: [],
      },
      weeklyStreak: [
        // Streak of 5 completed quizzes (weeks 1-5) for premium test user
        { week: '2025-W01', date: '2025-01-01', completed: true, completedAt: new Date('2025-01-01T10:30:00').toISOString(), quizSlug: '1' },
        { week: '2025-W02', date: '2025-01-08', completed: true, completedAt: new Date('2025-01-08T14:15:00').toISOString(), quizSlug: '2' },
        { week: '2025-W03', date: '2025-01-15', completed: true, completedAt: new Date('2025-01-15T09:45:00').toISOString(), quizSlug: '3' },
        { week: '2025-W04', date: '2025-01-22', completed: true, completedAt: new Date('2025-01-22T16:20:00').toISOString(), quizSlug: '4' },
        { week: '2025-W05', date: '2025-01-29', completed: true, completedAt: new Date('2025-01-29T11:00:00').toISOString(), quizSlug: '5' },
      ],
      performanceOverTime: [],
      comparisons: {
        public: {
          averageScore: 0,
          totalUsers: 0,
        },
        leagues: [],
      },
      seasonStats: null,
    })
    
    /* NOTE: Database code below is commented out for prototyping
     * Uncomment when database is ready
     *
    let user;
    try {
      user = await getUserFromToken(request)
    } catch (dbError: any) {
      console.error('[Stats API] Database error in getUserFromToken:', dbError)
      user = null
    }
    
    if (!user) {
      console.log('[Stats API] No user found - unauthorized')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Stats API] User found:', user.id)

    // Get all quiz completions for the user
    console.log('[Stats API] Fetching quiz completions...')
    let completions: Array<{
      score: number;
      totalQuestions: number;
      completedAt: Date;
      quizSlug: string;
    }> = []
    try {
      const dbCompletions = await prisma.quizCompletion.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: 'desc' },
      })
      completions = dbCompletions.map(c => ({
        score: c.score,
        totalQuestions: c.totalQuestions,
        completedAt: c.completedAt,
        quizSlug: c.quizSlug,
      }))
      console.log('[Stats API] Found completions:', completions.length)
    } catch (error: any) {
      console.error('[Stats API] Error fetching completions:', error)
      // If table doesn't exist or query fails, use empty array
      completions = []
    }

    // Calculate basic stats
    const totalQuestionsAttempted = completions.reduce((sum, c) => sum + c.totalQuestions, 0)
    const totalCorrectAnswers = completions.reduce((sum, c) => sum + c.score, 0)
    const averageScore = totalQuestionsAttempted > 0
      ? (totalCorrectAnswers / totalQuestionsAttempted) * 100 
      : 0

    // Calculate streaks
    const { currentQuestionStreak, bestQuestionStreak, currentQuizStreak, bestQuizStreak } = calculateStreaks(completions)

    // Get category performance
    // Note: Since we don't store individual question answers, we'll estimate category performance
    // by looking at quiz rounds and distributing the score proportionally
    let categoryStats: Array<{ name: string; percentage: number; correct: number; total: number; quizzes: number }> = []
    try {
      categoryStats = await calculateCategoryPerformance(user.id, completions)
    } catch (err) {
      console.error('Error calculating category performance:', err)
      // Continue with empty category stats
    }

    // Get weekly streak data (for scratchcard view)
    const weeklyStreakData = calculateWeeklyStreakData(completions)

    // Get performance over time
    const performanceOverTime = completions.map(c => {
      try {
        return {
          date: c.completedAt.toISOString().split('T')[0],
          score: c.totalQuestions > 0 ? (c.score / c.totalQuestions) * 100 : 0,
          quizSlug: c.quizSlug,
        }
      } catch (err) {
        console.error('[Stats API] Error processing completion:', err, c)
        return null
      }
    }).filter(Boolean) as Array<{ date: string; score: number; quizSlug: string }>

    // Get public average (all users' average score)
    let publicAverage = 0
    let uniqueUserCount = 0
    try {
      const allCompletions = await prisma.quizCompletion.findMany({
        select: {
          score: true,
          totalQuestions: true,
        },
      })
      const publicTotalQuestions = allCompletions.reduce((sum, c) => sum + c.totalQuestions, 0)
      const publicTotalCorrect = allCompletions.reduce((sum, c) => sum + c.score, 0)
      publicAverage = publicTotalQuestions > 0 
        ? (publicTotalCorrect / publicTotalQuestions) * 100 
        : 0
      
      // Get unique user count
      const uniqueUserIds = await prisma.quizCompletion.groupBy({
        by: ['userId'],
      })
      uniqueUserCount = uniqueUserIds.length
    } catch (err) {
      console.error('Error getting public stats:', err)
      // Continue with default values
    }

    // Get league comparisons
    let leagueComparisons: Array<{
      leagueId: string;
      leagueName: string;
      userAverage: number;
      leagueAverage: number;
      userRank: number;
      totalMembers: number;
    }> = []
    try {
      leagueComparisons = await getLeagueComparisons(user.id)
    } catch (err) {
      console.error('Error getting league comparisons:', err)
      // Continue with empty league comparisons
    }

    // Get current season stats
    let seasonStats = null
    try {
      const currentSeason = await prisma.season.findFirst({
        where: {
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      })

      if (currentSeason) {
        const stats = await prisma.seasonStats.findUnique({
          where: {
            userId_seasonId: {
              userId: user.id,
              seasonId: currentSeason.id,
            },
          },
        })
        if (stats) {
          seasonStats = {
            quizzesPlayed: stats.quizzesPlayed,
            perfectScores: stats.perfectScores,
            averageScore: stats.averageScore,
            longestStreakWeeks: stats.longestStreakWeeks,
            currentStreakWeeks: stats.currentStreakWeeks,
          }
        }
      }
    } catch (err) {
      console.error('Error getting season stats:', err)
      // Continue without season stats
    }

    console.log('[Stats API] Building response...')
    const response = {
      summary: {
        averageScore: Math.round(averageScore * 10) / 10,
        totalQuestionsAttempted,
        totalQuizzesPlayed: completions.length,
        totalCorrectAnswers,
        perfectScores: completions.filter(c => c.score === c.totalQuestions).length,
      },
      streaks: {
        currentQuestionStreak,
        bestQuestionStreak,
        currentQuizStreak,
        bestQuizStreak,
      },
      categories: {
        strongest: categoryStats.slice(0, 5),
        weakest: categoryStats.slice(-5).reverse(),
        all: categoryStats,
      },
      weeklyStreak: weeklyStreakData,
      performanceOverTime,
      comparisons: {
        public: {
          averageScore: Math.round(publicAverage * 10) / 10,
          totalUsers: uniqueUserCount,
        },
        leagues: leagueComparisons,
      },
      seasonStats,
    }
    
    console.log('[Stats API] Response built successfully')
    return NextResponse.json(response)
    */
  } catch (error: any) {
    console.error('[Stats API] Error fetching stats:', error)
    console.error('[Stats API] Error stack:', error.stack)
    console.error('[Stats API] Error name:', error.name)
    console.error('[Stats API] Error code:', error.code)
    console.error('[Stats API] Error meta:', error.meta)
    
    // Check if it's a Prisma error
    if (error.code === 'P2002' || error.code === 'P2025') {
      // Prisma unique constraint or record not found
      return NextResponse.json(
        { 
          error: 'Database error', 
          details: error.message,
        },
        { status: 500 }
      )
    }
    
    // Check if it's a connection error
    if (error.message?.includes('connect') || error.code === 'P1001') {
      return NextResponse.json(
        { 
          error: 'Database connection error', 
          details: 'Unable to connect to database. Please check your database connection.',
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats', 
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        code: error.code,
      },
      { status: 500 }
    )
  }
}

/* NOTE: All database-dependent helper functions below are kept for future use
 * They are not currently called since we return empty stats above
 */

/**
 * Calculate question and quiz streaks
 */
function calculateStreaks(completions: Array<{ score: number; totalQuestions: number; completedAt: Date }>) {
  if (completions.length === 0) {
    return {
      currentQuestionStreak: 0,
      bestQuestionStreak: 0,
      currentQuizStreak: 0,
      bestQuizStreak: 0,
    }
  }

  // Sort by date (oldest first)
  const sorted = [...completions].sort((a, b) => 
    a.completedAt.getTime() - b.completedAt.getTime()
  )

  // Calculate question streak (consecutive correct answers)
  // Since we don't have individual question tracking, we'll use perfect scores as a proxy
  let currentQuestionStreak = 0
  let bestQuestionStreak = 0
  let tempStreak = 0

  for (const completion of sorted) {
    if (completion.score === completion.totalQuestions) {
      tempStreak += completion.totalQuestions
      bestQuestionStreak = Math.max(bestQuestionStreak, tempStreak)
    } else {
      // Add partial streak from this quiz
      tempStreak += completion.score
      bestQuestionStreak = Math.max(bestQuestionStreak, tempStreak)
      tempStreak = 0
    }
  }
  currentQuestionStreak = tempStreak

  // Calculate quiz streak (consecutive quizzes played)
  let currentQuizStreak = 1
  let bestQuizStreak = 1
  let tempQuizStreak = 1

  for (let i = 1; i < sorted.length; i++) {
    const daysDiff = Math.floor(
      (sorted[i].completedAt.getTime() - sorted[i - 1].completedAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysDiff <= 7) { // Within a week
      tempQuizStreak++
      bestQuizStreak = Math.max(bestQuizStreak, tempQuizStreak)
    } else {
      tempQuizStreak = 1
    }
  }
  currentQuizStreak = tempQuizStreak

  return {
    currentQuestionStreak,
    bestQuestionStreak,
    currentQuizStreak,
    bestQuizStreak,
  }
}

/**
 * Calculate category performance
 * Since we don't have individual question answers, we estimate based on quiz structure
 */
async function calculateCategoryPerformance(
  userId: string,
  completions: Array<{ quizSlug: string; score: number; totalQuestions: number }>
) {
  const categoryMap = new Map<string, { correct: number; total: number; quizzes: number }>()

  // For each completion, try to get the quiz structure
  for (const completion of completions) {
    // Try to find quiz by slug (if stored) or by matching title
    // Since we don't have a slug field in Quiz, we'll need to estimate
    // For now, we'll distribute the score evenly across categories
    // This is a simplified approach - in production you'd want to store category breakdowns
    
    // Estimate: assume 5 categories per quiz (standard structure)
    const categoriesPerQuiz = 5
    const questionsPerCategory = Math.floor(completion.totalQuestions / categoriesPerQuiz)
    const scorePerCategory = Math.floor(completion.score / categoriesPerQuiz)
    
    // We'll use a placeholder category name for now
    // In production, you'd fetch the actual quiz structure
    for (let i = 0; i < categoriesPerQuiz; i++) {
      const categoryName = `Category ${i + 1}` // Placeholder
      const existing = categoryMap.get(categoryName) || { correct: 0, total: 0, quizzes: 0 }
      categoryMap.set(categoryName, {
        correct: existing.correct + scorePerCategory,
        total: existing.total + questionsPerCategory,
        quizzes: existing.quizzes + 1,
      })
    }
  }

  // Convert to array and calculate percentages
  const categoryStats = Array.from(categoryMap.entries())
    .map(([name, stats]) => ({
      name,
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      quizzes: stats.quizzes,
    }))
    .sort((a, b) => a.percentage - b.percentage)

  return categoryStats
}

/**
 * Calculate weekly streak data for scratchcard view
 */
function calculateWeeklyStreakData(completions: Array<{ completedAt: Date; quizSlug?: string }>) {
  // Map week key to completion data (keep earliest completion date for each week)
  const weekMap = new Map<string, { completedAt: Date; quizSlug?: string }>()
  
  for (const completion of completions) {
    const weekKey = getWeekKey(completion.completedAt)
    // If week already exists, keep the earliest completion date
    const existing = weekMap.get(weekKey)
    if (!existing || completion.completedAt < existing.completedAt) {
      weekMap.set(weekKey, {
        completedAt: completion.completedAt,
        quizSlug: completion.quizSlug,
      })
    }
  }

  // Generate last 52 weeks
  const weeks: Array<{ week: string; date: string; completed: boolean; completedAt?: string; quizSlug?: string }> = []
  const now = new Date()
  
  for (let i = 51; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - (i * 7))
    const weekKey = getWeekKey(date)
    const weekData = weekMap.get(weekKey)
    weeks.push({
      week: weekKey,
      date: date.toISOString().split('T')[0],
      completed: !!weekData,
      completedAt: weekData?.completedAt.toISOString(),
      quizSlug: weekData?.quizSlug || undefined,
    })
  }

  return weeks
}

/**
 * Get week key in format YYYY-WW
 */
function getWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const week = Math.ceil(((d.getTime() - week1.getTime()) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-W${week.toString().padStart(2, '0')}`
}

/**
 * Get league comparisons
 */
async function getLeagueComparisons(userId: string) {
  try {
    const userLeagues = await prisma.privateLeagueMember.findMany({
      where: {
        userId,
        leftAt: null,
      },
      include: {
        league: {
          include: {
            stats: {
              where: {
                quizSlug: null, // Overall stats
              },
            },
          },
        },
      },
    })

    const comparisons = []

    for (const member of userLeagues) {
      if (!member.league || !member.league.stats) continue
      
      const userStats = member.league.stats.find((s: any) => s.userId === userId)
      if (!userStats) continue

      // Get all members' stats for this league
      const allStats = member.league.stats.filter((s: any) => s.quizSlug === null)
      if (allStats.length === 0) continue

      const totalCorrect = allStats.reduce((sum: number, s: any) => sum + (s.totalCorrectAnswers || 0), 0)
      const totalQuizzes = allStats.reduce((sum: number, s: any) => sum + (s.quizzesPlayed || 0), 0)
      const leagueAverage = totalQuizzes > 0 ? totalCorrect / totalQuizzes : 0

      const userAverage = (userStats.totalCorrectAnswers || 0) / (userStats.quizzesPlayed || 1)

      // Calculate rank
      const sortedStats = [...allStats].sort((a: any, b: any) => 
        (b.totalCorrectAnswers || 0) - (a.totalCorrectAnswers || 0)
      )
      const userRank = sortedStats.findIndex((s: any) => s.userId === userId) + 1

      comparisons.push({
        leagueId: member.league.id,
        leagueName: member.league.name,
        userAverage: Math.round(userAverage * 10) / 10,
        leagueAverage: Math.round(leagueAverage * 10) / 10,
        userRank,
        totalMembers: allStats.length,
      })
    }

    return comparisons
  } catch (err) {
    console.error('Error in getLeagueComparisons:', err)
    return []
  }
}

