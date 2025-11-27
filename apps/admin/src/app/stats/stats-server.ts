/**
 * Server-side data fetching for stats page
 * Uses NextAuth for authentication
 * OPTIMIZED: Calls summary functions directly instead of going through API route
 */

import { auth } from '@schoolquiz/auth'
import { getStatsSummary, getStatsSummaryCritical, getStatsSummaryDeferred } from './stats-summary-server'

export interface StatsData {
  summary: {
    averageScore: number;
    totalQuestionsAttempted: number;
    totalQuizzesPlayed: number;
    totalCorrectAnswers: number;
    perfectScores: number;
  };
  streaks: {
    currentQuestionStreak: number;
    bestQuestionStreak: number;
    currentQuizStreak: number;
    bestQuizStreak: number;
  };
  categories: {
    strongest: Array<{ name: string; percentage: number; correct: number; total: number; quizzes: number }>;
    weakest: Array<{ name: string; percentage: number; correct: number; total: number; quizzes: number }>;
    all: Array<{ name: string; percentage: number; correct: number; total: number; quizzes: number }>;
  };
  weeklyStreak: Array<{ week: string; date: string; completed: boolean; completedAt?: string; quizSlug?: string | null }>;
  performanceOverTime: Array<{ date: string; score: number; quizSlug: string }>;
  comparisons: {
    public: {
      averageScore: number;
      totalUsers: number;
    };
    leagues: Array<{
      leagueId: string;
      leagueName: string;
      userAverage: number;
      leagueAverage: number;
      userRank: number;
      totalMembers: number;
    }>;
  };
  seasonStats: {
    quizzesPlayed: number;
    perfectScores: number;
    averageScore: number;
    longestStreakWeeks: number;
    currentStreakWeeks: number;
  } | null;
}

/**
 * Get critical stats data for first paint (server-side)
 * Uses NextAuth session for authentication
 * OPTIMIZED: Only loads essential data for fast initial render
 */
export async function getStatsDataCritical(): Promise<Pick<StatsData, 'summary' | 'streaks' | 'categories' | 'weeklyStreak'> | null> {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  return getStatsSummaryCritical(session.user.id)
}

/**
 * Get deferred stats data (server-side)
 * Uses NextAuth session for authentication
 * OPTIMIZED: Loads non-critical data after first paint
 */
export async function getStatsDataDeferred(): Promise<Pick<StatsData, 'performanceOverTime' | 'comparisons' | 'seasonStats'> | null> {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  return getStatsSummaryDeferred(session.user.id)
}

/**
 * Get complete stats data (server-side)
 * Uses NextAuth session for authentication
 * OPTIMIZED: Calls summary functions directly (no API route needed)
 * NOTE: For better performance, use getStatsDataCritical + getStatsDataDeferred
 */
export async function getStatsData(): Promise<StatsData | null> {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  // Call summary functions directly - no API route needed
  // This is faster and avoids authentication issues with server-side fetches
  return getStatsSummary(session.user.id)
}

