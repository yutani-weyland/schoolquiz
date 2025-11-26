/**
 * Optimized server-side stats summary queries
 * Uses Prisma aggregates and parallel execution for maximum performance
 */

import { prisma } from '@schoolquiz/db'
import { StatsData } from './stats-server'

/**
 * Get summary stats using database aggregates (single query)
 */
async function getSummaryStats(userId: string) {
  const startTime = Date.now()
  
  const [summary, perfectScores] = await Promise.all([
    // Aggregate query - compute in database
    prisma.quizCompletion.aggregate({
      where: { userId },
      _count: { id: true }, // totalQuizzesPlayed
      _sum: {
        totalQuestions: true, // totalQuestionsAttempted
        score: true, // totalCorrectAnswers
      },
    }),
    // Perfect scores count (separate lightweight query)
    prisma.quizCompletion.count({
      where: {
        userId,
        // Use raw query for score = totalQuestions comparison
        // Prisma doesn't support direct field comparison in where clause
      },
    }),
  ])
  
  // Get perfect scores using raw query for field comparison
  const perfectScoresResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::int as count
    FROM quiz_completions
    WHERE user_id = ${userId} AND score = total_questions
  `
  const perfectScoresCount = Number(perfectScoresResult[0]?.count || 0)
  
  // Calculate average score
  const totalQuestions = summary._sum.totalQuestions || 0
  const totalCorrect = summary._sum.score || 0
  const averageScore = totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100 * 10) / 10
    : 0
  
  const queryTime = Date.now() - startTime
  console.log(`[Stats Summary] Summary stats query took ${queryTime}ms`)
  
  return {
    averageScore,
    totalQuestionsAttempted: totalQuestions,
    totalQuizzesPlayed: summary._count.id,
    totalCorrectAnswers: totalCorrect,
    perfectScores: perfectScoresCount,
  }
}

/**
 * Get completion weeks for streak calculation (minimal data)
 */
async function getCompletionWeeks(userId: string) {
  const startTime = Date.now()
  
  const completions = await prisma.quizCompletion.findMany({
    where: { userId },
    select: {
      completedAt: true,
      quizSlug: true,
    },
    orderBy: { completedAt: 'desc' },
  })
  
  const queryTime = Date.now() - startTime
  console.log(`[Stats Summary] Completion weeks query took ${queryTime}ms (${completions.length} records)`)
  
  return completions
}

/**
 * Calculate streaks from completion data
 */
function calculateStreaks(
  completions: Array<{ completedAt: Date; score: number; totalQuestions: number }>
) {
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
    const isPerfect = completion.score === completion.totalQuestions
    if (isPerfect) {
      tempStreak += completion.totalQuestions || 0
      bestQuestionStreak = Math.max(bestQuestionStreak, tempStreak)
    } else {
      // Add partial streak from this quiz
      tempStreak += completion.score || 0
      bestQuestionStreak = Math.max(bestQuestionStreak, tempStreak)
      tempStreak = 0
    }
  }
  currentQuestionStreak = tempStreak

  // Calculate quiz streak (consecutive quizzes played within 7 days)
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
 * Calculate weekly streak data for scratchcard view
 */
function calculateWeeklyStreakData(
  completions: Array<{ completedAt: Date; quizSlug?: string | null }>
) {
  // Map week key to completion data (keep earliest completion date for each week)
  const weekMap = new Map<string, { completedAt: Date; quizSlug?: string | null }>()
  
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
  const weeks: Array<{ week: string; date: string; completed: boolean; completedAt?: string; quizSlug?: string | null }> = []
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
 * Get performance over time (last 100 quizzes with minimal fields)
 */
async function getPerformanceOverTime(userId: string) {
  const startTime = Date.now()
  
  const performanceData = await prisma.quizCompletion.findMany({
    where: { userId },
    select: {
      completedAt: true,
      score: true,
      totalQuestions: true,
      quizSlug: true,
    },
    orderBy: { completedAt: 'asc' },
    take: 100, // Limit to last 100 quizzes
  })
  
  const queryTime = Date.now() - startTime
  console.log(`[Stats Summary] Performance over time query took ${queryTime}ms (${performanceData.length} records)`)
  
  // Transform in TypeScript
  return performanceData.map(c => ({
    date: c.completedAt.toISOString().split('T')[0],
    score: c.totalQuestions > 0 ? Math.round((c.score / c.totalQuestions) * 100 * 10) / 10 : 0,
    quizSlug: c.quizSlug,
  }))
}

/**
 * Get category performance
 * Note: This is a simplified version - in production you'd want to use answer_stats or a materialized view
 */
async function getCategoryPerformance(
  userId: string,
  completions: Array<{ quizSlug: string; score: number; totalQuestions: number }>
) {
  const startTime = Date.now()
  
  // For now, we'll use a simplified approach:
  // Get all quizzes user has completed and their rounds/categories
  // Then estimate category performance based on quiz structure
  
  if (completions.length === 0) {
    return []
  }
  
  // Get quiz slugs
  const quizSlugs = completions.map(c => c.quizSlug).filter(Boolean) as string[]
  
  // Fetch quiz rounds with categories (minimal data)
  const quizzes = await prisma.quiz.findMany({
    where: {
      slug: { in: quizSlugs },
    },
    select: {
      slug: true,
      rounds: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          questions: {
            select: {
              id: true,
            },
            take: 1, // Just to count questions per round
          },
        },
      },
    },
  })
  
  // Create a map of quiz slug to completion data
  const completionMap = new Map(
    completions.map(c => [c.quizSlug, c])
  )
  
  // Aggregate category stats
  const categoryMap = new Map<string, { correct: number; total: number; quizzes: Set<string> }>()
  
  for (const quiz of quizzes) {
    const completion = completionMap.get(quiz.slug)
    if (!completion) continue
    
    // Distribute score across rounds/categories
    const rounds = quiz.rounds.filter(r => r.category)
    if (rounds.length === 0) continue
    
    const questionsPerRound = Math.floor(completion.totalQuestions / rounds.length)
    const scorePerRound = Math.floor(completion.score / rounds.length)
    
    for (const round of rounds) {
      if (!round.category) continue
      
      const categoryName = round.category.name
      const existing = categoryMap.get(categoryName) || { correct: 0, total: 0, quizzes: new Set() }
      
      categoryMap.set(categoryName, {
        correct: existing.correct + scorePerRound,
        total: existing.total + questionsPerRound,
        quizzes: existing.quizzes.add(quiz.slug),
      })
    }
  }
  
  // Convert to array and calculate percentages
  const categoryStats = Array.from(categoryMap.entries())
    .map(([name, stats]) => ({
      name,
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100 * 10) / 10 : 0,
      quizzes: stats.quizzes.size,
    }))
    .sort((a, b) => a.percentage - b.percentage)
  
  const queryTime = Date.now() - startTime
  console.log(`[Stats Summary] Category performance query took ${queryTime}ms`)
  
  return categoryStats
}

/**
 * Get public stats (aggregated across all users)
 */
async function getPublicStats() {
  const startTime = Date.now()
  
  const [publicStats, uniqueUserCount] = await Promise.all([
    prisma.quizCompletion.aggregate({
      _sum: {
        totalQuestions: true,
        score: true,
      },
      _count: { id: true },
    }),
    prisma.quizCompletion.groupBy({
      by: ['userId'],
    }),
  ])
  
  const totalQuestions = publicStats._sum.totalQuestions || 0
  const totalCorrect = publicStats._sum.score || 0
  const averageScore = totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100 * 10) / 10
    : 0
  
  const queryTime = Date.now() - startTime
  console.log(`[Stats Summary] Public stats query took ${queryTime}ms`)
  
  return {
    averageScore,
    totalUsers: uniqueUserCount.length,
  }
}

/**
 * Get league comparisons (optimized)
 */
async function getLeagueComparisons(userId: string) {
  const startTime = Date.now()
  
  // Fetch only league IDs user belongs to
  const userLeagueIds = await prisma.privateLeagueMember.findMany({
    where: { userId, leftAt: null },
    select: { leagueId: true },
  })
  
  if (userLeagueIds.length === 0) {
    return []
  }
  
  const leagueIds = userLeagueIds.map(m => m.leagueId)
  
  // Parallel queries for each league
  const leagueComparisons = await Promise.all(
    leagueIds.map(async (leagueId) => {
      // Get league name (minimal)
      const league = await prisma.privateLeague.findUnique({
        where: { id: leagueId },
        select: { id: true, name: true },
      })
      
      if (!league) return null
      
      // Get aggregated stats for league
      const leagueStats = await prisma.privateLeagueStats.aggregate({
        where: {
          leagueId,
          quizSlug: null, // Overall stats
        },
        _count: { userId: true }, // totalMembers
        _sum: { totalCorrectAnswers: true },
        _avg: { totalCorrectAnswers: true },
      })
      
      // Get user's stats
      const userStats = await prisma.privateLeagueStats.findUnique({
        where: {
          leagueId_userId_quizSlug: {
            leagueId,
            userId,
            quizSlug: null,
          },
        },
        select: {
          totalCorrectAnswers: true,
          quizzesPlayed: true,
        },
      })
      
      // Get user rank using raw query with window function
      const userRankResult = await prisma.$queryRaw<Array<{ rank: number }>>`
        SELECT rank
        FROM (
          SELECT 
            user_id as "userId",
            ROW_NUMBER() OVER (ORDER BY total_correct_answers DESC) as rank
          FROM private_league_stats
          WHERE league_id = ${leagueId} AND quiz_slug IS NULL
        ) ranked
        WHERE "userId" = ${userId}
      `
      
      const userRank = userRankResult[0]?.rank || 0
      const totalMembers = leagueStats._count.userId
      const leagueTotalCorrect = leagueStats._sum.totalCorrectAnswers || 0
      const leagueQuizzes = totalMembers > 0 ? Math.round(leagueTotalCorrect / totalMembers) : 0
      const leagueAverage = leagueQuizzes > 0 ? Math.round((leagueTotalCorrect / leagueQuizzes) * 10) / 10 : 0
      
      const userAverage = userStats && userStats.quizzesPlayed > 0
        ? Math.round((userStats.totalCorrectAnswers / userStats.quizzesPlayed) * 10) / 10
        : 0
      
      return {
        leagueId: league.id,
        leagueName: league.name,
        userAverage,
        leagueAverage,
        userRank,
        totalMembers,
      }
    })
  )
  
  const queryTime = Date.now() - startTime
  console.log(`[Stats Summary] League comparisons query took ${queryTime}ms (${leagueComparisons.length} leagues)`)
  
  return leagueComparisons.filter((c): c is NonNullable<typeof c> => c !== null)
}

/**
 * Get season stats
 */
async function getSeasonStats(userId: string) {
  const startTime = Date.now()
  
  try {
    const currentSeason = await prisma.season.findFirst({
      where: {
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      select: { id: true },
    })

    if (!currentSeason) {
      return null
    }

    const stats = await prisma.seasonStats.findUnique({
      where: {
        userId_seasonId: {
          userId,
          seasonId: currentSeason.id,
        },
      },
      select: {
        quizzesPlayed: true,
        perfectScores: true,
        averageScore: true,
        longestStreakWeeks: true,
        currentStreakWeeks: true,
      },
    })
    
    const queryTime = Date.now() - startTime
    console.log(`[Stats Summary] Season stats query took ${queryTime}ms`)
    
    return stats
  } catch (err) {
    console.error('[Stats Summary] Error getting season stats:', err)
    return null
  }
}

/**
 * Get complete stats summary (optimized with parallel queries)
 */
export async function getStatsSummary(userId: string): Promise<StatsData> {
  const startTime = Date.now()
  
  // Execute all queries in parallel
  const [
    summary,
    completionWeeks,
    performanceData,
    publicStats,
    leagueComparisons,
    seasonStats,
  ] = await Promise.all([
    getSummaryStats(userId),
    getCompletionWeeks(userId),
    getPerformanceOverTime(userId),
    getPublicStats(),
    getLeagueComparisons(userId),
    getSeasonStats(userId),
  ])
  
  // Fetch completions with scores for streaks and category performance
  const completionsWithScores = await prisma.quizCompletion.findMany({
    where: { userId },
    select: {
      completedAt: true,
      quizSlug: true,
      score: true,
      totalQuestions: true,
    },
    orderBy: { completedAt: 'desc' },
  })
  
  // Calculate streaks from completion data with scores
  const streaks = calculateStreaks(completionsWithScores)
  
  // Calculate weekly streak
  const weeklyStreak = calculateWeeklyStreakData(completionsWithScores)
  
  // Get category performance
  const categoryStats = await getCategoryPerformance(userId, completionsWithScores)
  
  const totalTime = Date.now() - startTime
  console.log(`[Stats Summary] Total stats summary took ${totalTime}ms`)
  
  return {
    summary,
    streaks,
    categories: {
      strongest: categoryStats.slice(0, 5),
      weakest: categoryStats.slice(-5).reverse(),
      all: categoryStats,
    },
    weeklyStreak,
    performanceOverTime: performanceData,
    comparisons: {
      public: publicStats,
      leagues: leagueComparisons,
    },
    seasonStats,
  }
}

