/**
 * Optimized server-side stats summary queries
 * Uses Prisma aggregates and parallel execution for maximum performance
 */

import { prisma } from '@schoolquiz/db'
import { StatsData } from './stats-server'
import { unstable_cache } from 'next/cache'

/**
 * Get summary stats from pre-computed summary table (ultra-fast single SELECT)
 * Falls back to aggregation if summary table doesn't exist yet
 */
async function getSummaryStats(userId: string) {
  const startTime = Date.now()
  
  try {
    // Try to get from pre-computed summary table first (fastest)
    const summaryResult = await prisma.$queryRaw<Array<{
      total_quizzes_played: number
      total_questions_attempted: number
      total_correct_answers: number
      perfect_scores: number
      average_score: number
      current_question_streak: number
      best_question_streak: number
      current_quiz_streak: number
      best_quiz_streak: number
    }>>`
      SELECT 
        total_quizzes_played,
        total_questions_attempted,
        total_correct_answers,
        perfect_scores,
        average_score,
        current_question_streak,
        best_question_streak,
        current_quiz_streak,
        best_quiz_streak
      FROM user_stats_summary
      WHERE user_id = ${userId}
    `
    
    if (summaryResult.length > 0) {
      const summary = summaryResult[0]
      const queryTime = Date.now() - startTime
      console.log(`[Stats Summary] Summary stats from pre-computed table took ${queryTime}ms`)
      
      return {
        averageScore: Number(summary.average_score),
        totalQuestionsAttempted: summary.total_questions_attempted,
        totalQuizzesPlayed: summary.total_quizzes_played,
        totalCorrectAnswers: summary.total_correct_answers,
        perfectScores: summary.perfect_scores,
      }
    } else {
      // Table exists but is empty
      console.warn('[Stats Summary] Pre-computed table exists but is empty. Run populate_all_user_stats() to populate existing data.')
    }
  } catch (error: any) {
    // Table doesn't exist yet or error - fall back to aggregation
    console.warn('[Stats Summary] Pre-computed table not available, using aggregation fallback:', error?.message || 'Unknown error')
  }
  
  // Fallback: Aggregate query - compute in database
  const summary = await prisma.quizCompletion.aggregate({
    where: { userId },
    _count: { id: true },
    _sum: {
      totalQuestions: true,
      score: true,
    },
  })
  
  // Get perfect scores using raw query
  const perfectScoresResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::int as count
    FROM quiz_completions
    WHERE "userId" = ${userId} AND score = "totalQuestions"
  `
  const perfectScoresCount = Number(perfectScoresResult[0]?.count || 0)
  
  // Calculate average score
  const totalQuestions = summary._sum.totalQuestions || 0
  const totalCorrect = summary._sum.score || 0
  const averageScore = totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100 * 10) / 10
    : 0
  
  const queryTime = Date.now() - startTime
  console.log(`[Stats Summary] Summary stats query (fallback) took ${queryTime}ms`)
  
  return {
    averageScore,
    totalQuestionsAttempted: totalQuestions,
    totalQuizzesPlayed: summary._count.id,
    totalCorrectAnswers: totalCorrect,
    perfectScores: perfectScoresCount,
  }
}

/**
 * Get completion weeks for streak calculation (minimal data, limited to last 52 weeks)
 */
async function getCompletionWeeks(userId: string) {
  const startTime = Date.now()
  
  // Only fetch completions from last 52 weeks (enough for weekly streak)
  const fiftyTwoWeeksAgo = new Date()
  fiftyTwoWeeksAgo.setDate(fiftyTwoWeeksAgo.getDate() - (52 * 7))
  
  const completions = await prisma.quizCompletion.findMany({
    where: { 
      userId,
      completedAt: { gte: fiftyTwoWeeksAgo },
    },
    select: {
      completedAt: true,
      quizSlug: true,
    },
    orderBy: { completedAt: 'desc' },
    take: 100, // Limit to 100 most recent (more than enough for 52 weeks)
  })
  
  const queryTime = Date.now() - startTime
  console.log(`[Stats Summary] Completion weeks query took ${queryTime}ms (${completions.length} records, limited to last 52 weeks)`)
  
  return completions
}

/**
 * Get streaks from pre-computed summary table (ultra-fast)
 * Falls back to calculation if summary table doesn't exist
 */
async function getStreaks(userId: string): Promise<{
  currentQuestionStreak: number
  bestQuestionStreak: number
  currentQuizStreak: number
  bestQuizStreak: number
}> {
  const startTime = Date.now()
  
  try {
    // Try to get from pre-computed summary table first
    const streaksResult = await prisma.$queryRaw<Array<{
      current_question_streak: number
      best_question_streak: number
      current_quiz_streak: number
      best_quiz_streak: number
    }>>`
      SELECT 
        current_question_streak,
        best_question_streak,
        current_quiz_streak,
        best_quiz_streak
      FROM user_stats_summary
      WHERE user_id = ${userId}
    `
    
    if (streaksResult.length > 0) {
      const streaks = streaksResult[0]
      const queryTime = Date.now() - startTime
      console.log(`[Stats Summary] Streaks from pre-computed table took ${queryTime}ms`)
      
      return {
        currentQuestionStreak: streaks.current_question_streak,
        bestQuestionStreak: streaks.best_question_streak,
        currentQuizStreak: streaks.current_quiz_streak,
        bestQuizStreak: streaks.best_quiz_streak,
      }
    }
  } catch (error: any) {
    // Table doesn't exist yet - fall back to calculation
    console.log('[Stats Summary] Pre-computed streaks not available, using calculation fallback')
  }
  
  // Fallback: Calculate from completion data
  const completions = await prisma.quizCompletion.findMany({
    where: { userId },
    select: {
      completedAt: true,
      score: true,
      totalQuestions: true,
    },
    orderBy: { completedAt: 'asc' },
  })
  
  return calculateStreaksFromCompletions(completions)
}

/**
 * Calculate streaks from completion data (fallback)
 */
function calculateStreaksFromCompletions(
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

  // Calculate question streak
  let currentQuestionStreak = 0
  let bestQuestionStreak = 0
  let tempStreak = 0

  for (const completion of sorted) {
    const isPerfect = completion.score === completion.totalQuestions
    if (isPerfect) {
      tempStreak += completion.totalQuestions
      bestQuestionStreak = Math.max(bestQuestionStreak, tempStreak)
    } else {
      tempStreak += completion.score
      bestQuestionStreak = Math.max(bestQuestionStreak, tempStreak)
      tempStreak = 0
    }
  }
  currentQuestionStreak = tempStreak

  // Calculate quiz streak
  let currentQuizStreak = 1
  let bestQuizStreak = 1
  let tempQuizStreak = 1

  for (let i = 1; i < sorted.length; i++) {
    const daysDiff = Math.floor(
      (sorted[i].completedAt.getTime() - sorted[i - 1].completedAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysDiff <= 7) {
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
 * Get category performance from pre-computed summary table (ultra-fast)
 * Falls back to calculation if summary table doesn't exist
 */
async function getCategoryPerformance(
  userId: string,
  completions?: Array<{ quizSlug: string; score: number; totalQuestions: number }>
) {
  const startTime = Date.now()
  
  try {
    // Try to get from pre-computed category stats table first
    const categoryStatsResult = await prisma.$queryRaw<Array<{
      category_name: string
      correct_answers: number
      total_questions: number
      quizzes_count: number
      percentage: number
    }>>`
      SELECT 
        category_name,
        correct_answers,
        total_questions,
        quizzes_count,
        percentage
      FROM user_category_stats
      WHERE user_id = ${userId}
      ORDER BY percentage DESC
    `
    
    if (categoryStatsResult.length > 0) {
      const queryTime = Date.now() - startTime
      console.log(`[Stats Summary] Category performance from pre-computed table took ${queryTime}ms`)
      
      return categoryStatsResult.map(stat => ({
        name: stat.category_name,
        correct: stat.correct_answers,
        total: stat.total_questions,
        percentage: Number(stat.percentage),
        quizzes: stat.quizzes_count,
      }))
    }
  } catch (error: any) {
    // Table doesn't exist yet - fall back to calculation
    console.log('[Stats Summary] Pre-computed category stats not available, using calculation fallback')
  }
  
  // Fallback: Calculate from quiz structure
  if (!completions || completions.length === 0) {
    return []
  }
  
  const quizSlugs = completions.map(c => c.quizSlug).filter(Boolean) as string[]
  
  const quizzes = await prisma.quiz.findMany({
    where: { slug: { in: quizSlugs } },
    select: {
      slug: true,
      rounds: {
        select: {
          category: {
            select: { id: true, name: true },
          },
        },
      },
    },
  })
  
  const completionMap = new Map(completions.map(c => [c.quizSlug, c]))
  const categoryMap = new Map<string, { correct: number; total: number; quizzes: Set<string> }>()
  
  for (const quiz of quizzes) {
    const completion = completionMap.get(quiz.slug)
    if (!completion) continue
    
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
  console.log(`[Stats Summary] Category performance query (fallback) took ${queryTime}ms`)
  
  return categoryStats
}

/**
 * Get public stats from pre-computed summary table (ultra-fast)
 * Falls back to aggregation if summary table doesn't exist
 */
async function getPublicStats() {
  const startTime = Date.now()
  
  try {
    // Try to get from pre-computed summary table first
    const publicStatsResult = await prisma.$queryRaw<Array<{
      total_users: number
      total_quizzes_played: number
      average_score: number
    }>>`
      SELECT 
        total_users,
        total_quizzes_played,
        average_score
      FROM public_stats_summary
      WHERE id = 'global'
    `
    
    if (publicStatsResult.length > 0) {
      const stats = publicStatsResult[0]
      const queryTime = Date.now() - startTime
      console.log(`[Stats Summary] Public stats from pre-computed table took ${queryTime}ms`)
      
      return {
        averageScore: Number(stats.average_score),
        totalUsers: stats.total_users,
      }
    }
  } catch (error: any) {
    // Table doesn't exist yet - fall back to aggregation
    console.log('[Stats Summary] Pre-computed public stats not available, using aggregation fallback')
  }
  
  // Fallback: Aggregate query
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
  console.log(`[Stats Summary] Public stats query (fallback) took ${queryTime}ms`)
  
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
      
      // Get user's stats (use findFirst since quizSlug can be null)
      const userStats = await prisma.privateLeagueStats.findFirst({
        where: {
          leagueId,
          userId,
          quizSlug: null,
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
            "userId",
            ROW_NUMBER() OVER (ORDER BY "totalCorrectAnswers" DESC) as rank
          FROM private_league_stats
          WHERE "leagueId" = ${leagueId} AND "quizSlug" IS NULL
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
 * Get critical stats for first paint (fast, essential data only)
 * This loads immediately to show content to users
 */
export async function getStatsSummaryCritical(userId: string): Promise<Pick<StatsData, 'summary' | 'streaks' | 'categories' | 'weeklyStreak'>> {
  const startTime = Date.now()
  
  // OPTIMIZATION: Fetch completions once with scores (limited to last 52 weeks for performance)
  // This data is used for weekly streak calculation
  const fiftyTwoWeeksAgo = new Date()
  fiftyTwoWeeksAgo.setDate(fiftyTwoWeeksAgo.getDate() - (52 * 7))
  
  // OPTIMIZATION: Use cached version for 30 seconds (stats don't change that frequently)
  // This dramatically reduces database load for repeated requests
  const getCachedStats = unstable_cache(
    async () => {
      // Execute ALL critical queries in parallel for maximum performance
      const [summaryAndStreaks, categoryStats, completionsWithScores] = await Promise.all([
        getSummaryStatsAndStreaks(userId), // Combined query (saves 1 round trip)
        getCategoryPerformance(userId), // Function will use pre-computed table first
        prisma.quizCompletion.findMany({
          where: { 
            userId,
            completedAt: { gte: fiftyTwoWeeksAgo },
          },
          select: {
            completedAt: true,
            quizSlug: true,
            score: true,
            totalQuestions: true,
          },
          orderBy: { completedAt: 'desc' },
          take: 52, // Only need 52 records max (one per week)
        }),
      ])
      
      return { summaryAndStreaks, categoryStats, completionsWithScores }
    },
    [`stats-critical-${userId}`],
    {
      revalidate: 30, // Cache for 30 seconds
      tags: [`stats-${userId}`], // Can be invalidated when user completes a quiz
    }
  )
  
  const { summaryAndStreaks, categoryStats, completionsWithScores } = await getCachedStats()
  const { summary, streaks } = summaryAndStreaks
  
  // Calculate weekly streak from completions (in-memory, fast)
  const weeklyStreak = calculateWeeklyStreakData(completionsWithScores.map(c => ({
    completedAt: c.completedAt,
    quizSlug: c.quizSlug,
  })))
  
  const totalTime = Date.now() - startTime
  console.log(`[Stats Summary] Critical stats took ${totalTime}ms`)
  
  return {
    summary,
    streaks,
    categories: {
      strongest: categoryStats.slice(0, 5),
      weakest: categoryStats.slice(-5).reverse(),
      all: categoryStats,
    },
    weeklyStreak,
  }
}

/**
 * Get deferred stats (non-critical, can load after first paint)
 * This includes heavy queries like league comparisons
 */
export async function getStatsSummaryDeferred(userId: string): Promise<Pick<StatsData, 'performanceOverTime' | 'comparisons' | 'seasonStats'>> {
  const startTime = Date.now()
  
  // Execute deferred queries in parallel
  const [performanceData, publicStats, seasonStats] = await Promise.all([
    getPerformanceOverTime(userId),
    getPublicStats(),
    getSeasonStats(userId),
  ])
  
  // League comparisons removed - too slow (4.3s)
  // Can be re-enabled later with optimizations
  
  const totalTime = Date.now() - startTime
  console.log(`[Stats Summary] Deferred stats took ${totalTime}ms`)
  
  return {
    performanceOverTime: performanceData,
    comparisons: {
      public: publicStats,
      leagues: [], // Disabled for now
    },
    seasonStats,
  }
}

/**
 * Get complete stats summary (for backward compatibility)
 * NOTE: Use getStatsSummaryCritical + getStatsSummaryDeferred for better performance
 */
export async function getStatsSummary(userId: string): Promise<StatsData> {
  const [critical, deferred] = await Promise.all([
    getStatsSummaryCritical(userId),
    getStatsSummaryDeferred(userId),
  ])
  
  return {
    ...critical,
    ...deferred,
  }
}

