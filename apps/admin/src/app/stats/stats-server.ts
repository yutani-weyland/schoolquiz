/**
 * Server-side data fetching for stats page
 * Uses cookies for authentication
 */

import { getServerAuthUser, getAuthTokenFromCookies } from '@/lib/server-auth'
import { unstable_cache } from 'next/cache'

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
 * Fetch stats from API (server-side)
 * Uses internal API route which now supports cookies
 */
async function fetchStatsFromAPI(userId: string): Promise<StatsData> {
  try {
    // Get auth token from cookies
    const token = await getAuthTokenFromCookies()
    
    if (!token) {
      throw new Error('No auth token found')
    }

    // Call the stats API endpoint
    // Construct absolute URL for server-side fetch
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_BASE_URL || 'localhost:3001'
    const baseUrl = `${protocol}://${host}`
    
    const response = await fetch(`${baseUrl}/api/stats`, {
      headers: {
        'X-User-Id': userId,
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store', // Don't cache the fetch itself, we'll use unstable_cache
    })

    if (!response.ok) {
      // Return empty stats for prototyping
      if (response.status === 500 || response.status === 503) {
        return getEmptyStats()
      }
      throw new Error(`Failed to fetch stats: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('[stats-server] Error fetching stats:', error)
    // Return empty stats on error for graceful degradation
    return getEmptyStats()
  }
}

/**
 * Get empty stats structure (for prototyping/fallback)
 */
function getEmptyStats(): StatsData {
  return {
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
    weeklyStreak: [],
    performanceOverTime: [],
    comparisons: {
      public: {
        averageScore: 0,
        totalUsers: 0,
      },
      leagues: [],
    },
    seasonStats: null,
  }
}

/**
 * Get stats data (server-side)
 * Uses caching to prevent duplicate database queries
 */
export async function getStatsData(): Promise<StatsData | null> {
  const authUser = await getServerAuthUser()
  
  if (!authUser) {
    return null
  }

  // Cache stats for 2 minutes (stats don't change frequently)
  const getCachedStats = unstable_cache(
    async (uid: string) => fetchStatsFromAPI(uid),
    [`stats-${authUser.userId}`],
    {
      revalidate: 120, // 2 minutes
      tags: [`stats-${authUser.userId}`],
    }
  )

  return getCachedStats(authUser.userId)
}

