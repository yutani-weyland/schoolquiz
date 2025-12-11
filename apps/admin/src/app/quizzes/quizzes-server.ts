import { getSession } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { unstable_cache } from 'next/cache'

/**
 * Server-side data fetching for Quizzes page
 */

export interface QuizCompletion {
  quizSlug: string
  score: number
  totalQuestions: number
  completedAt: string
  teamId?: string | null
  teamName?: string | null
  teamColor?: string | null
}

export interface CustomQuiz {
  id: string
  slug: string
  title: string
  blurb?: string
  colorHex?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface OfficialQuiz {
  id: number // Numeric ID for compatibility with QuizCard component
  slug: string
  title: string
  blurb: string
  weekISO: string
  colorHex: string
  status: "available" | "coming_soon"
  tags?: string[]
}

export interface QuizzesPageData {
  completions: Record<string, QuizCompletion[]> // Array of completions per quiz (one per team)
  customQuizzes: CustomQuiz[]
  customQuizzesTotal: number // Total count for pagination
  customQuizzesHasMore: boolean // Whether there are more quizzes to load
  isPremium: boolean
  userName: string | null
  isLoggedIn: boolean
}

/**
 * Fetch quiz completions for a user
 * OPTIMIZATION: Only fetch completions (no slug filter) - much faster query
 * We'll match to the static quiz list client-side. This avoids querying for
 * all 12 quiz slugs when user may only have completed 1-2 quizzes.
 */
async function fetchCompletions(userId: string): Promise<Record<string, QuizCompletion[]>> {
  try {
    // OPTIMIZATION: Fetch all user completions with team info
    // Returns completions grouped by quizSlug (array of completions per quiz)
    // This allows showing best score per team or filtering by selected team
    const completions = await prisma.quizCompletion.findMany({
      where: {
        userId,
      },
      select: {
        quizSlug: true,
        score: true,
        totalQuestions: true,
        completedAt: true,
        teamId: true,
        team: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      // OPTIMIZATION: Limit to reasonable number (most users won't complete >50 quizzes total)
      take: 50,
      orderBy: {
        completedAt: 'desc',
      },
    })

    // Group completions by quizSlug - each quiz can have multiple completions (one per team)
    const completionsByQuiz = completions.reduce<Record<string, QuizCompletion[]>>((acc, completion) => {
      const slug = completion.quizSlug
      if (!acc[slug]) {
        acc[slug] = []
      }
      acc[slug].push({
        quizSlug: completion.quizSlug,
        score: completion.score,
        totalQuestions: completion.totalQuestions,
        completedAt: completion.completedAt.toISOString(),
        teamId: completion.teamId || null,
        teamName: completion.team?.name || null,
        teamColor: completion.team?.color || null,
      })
      return acc
    }, {})

    return completionsByQuiz
  } catch (error) {
    console.error('Error fetching completions:', error)
    // Return empty map if there's an error (table might not exist)
    return {}
  }
}

/**
 * Fetch official quizzes from database
 * OPTIMIZATION: Fetches published official quizzes ordered by weekISO (newest first)
 * Returns quizzes in format compatible with QuizCard component
 */
export async function fetchOfficialQuizzes(): Promise<OfficialQuiz[]> {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: {
        quizType: 'OFFICIAL',
        status: 'published',
        slug: { not: null }, // Only quizzes with slugs
      },
      select: {
        id: true,
        slug: true,
        title: true,
        blurb: true,
        weekISO: true,
        colorHex: true,
        status: true,
        createdAt: true,
      },
      orderBy: [
        { weekISO: 'desc' }, // Newest weekISO first
        { createdAt: 'desc' }, // Fallback to creation date for null weekISO
      ],
      // Filter out test/demo quizzes - prefer numbered quizzes 1-12
      // Order numeric slugs first, then others
      take: 50, // Reasonable limit
    })

    // OPTIMIZATION: Client-side sorting for complex logic (numeric vs non-numeric slugs)
    // Database query already ordered by weekISO DESC, createdAt DESC for efficiency
    // This final sort prioritizes numeric slugs (1-12) before others
    // Sort: numeric slugs first (1-12), then others
    // Within numeric slugs, sort by slug number descending (12, 11, 10...)
    // Within non-numeric, sort by weekISO desc (newest first)
    const sortedQuizzes = [...quizzes].sort((a, b) => {
      const aSlug = a.slug || ''
      const bSlug = b.slug || ''
      const aIsNumeric = /^\d+$/.test(aSlug)
      const bIsNumeric = /^\d+$/.test(bSlug)
      
      // Numeric slugs come first
      if (aIsNumeric && !bIsNumeric) return -1
      if (!aIsNumeric && bIsNumeric) return 1
      
      // Both numeric: sort by number descending (12, 11, 10... 1)
      if (aIsNumeric && bIsNumeric) {
        return parseInt(bSlug, 10) - parseInt(aSlug, 10)
      }
      
      // Both non-numeric: sort by weekISO
      const aDate = a.weekISO || ''
      const bDate = b.weekISO || ''
      if (aDate && bDate) {
        return bDate.localeCompare(aDate) // Descending (newest first)
      }
      if (aDate) return -1
      if (bDate) return 1
      
      // Both null: sort by createdAt
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })

    // Transform to match QuizCard format
    // Convert string ID to number for compatibility (use slug as numeric identifier)
    return sortedQuizzes.map(quiz => ({
      id: quiz.slug ? parseInt(quiz.slug, 10) || 0 : 0, // Use slug as numeric ID
      slug: quiz.slug || '',
      title: quiz.title,
      blurb: quiz.blurb || '',
      weekISO: quiz.weekISO || new Date().toISOString().split('T')[0],
      colorHex: quiz.colorHex || '#FFE135', // Default yellow
      status: (quiz.status === 'published' ? 'available' : 'coming_soon') as "available" | "coming_soon",
    }))
  } catch (error) {
    console.error('Error fetching official quizzes:', error)
    // Return empty array if there's an error (table might not exist or not migrated)
    return []
  }
}

/**
 * Fetch custom quizzes for a premium user with pagination
 * OPTIMIZATION: Limit initial fetch to 12 quizzes - reduces initial payload by ~75%
 * Returns pagination metadata for "Load More" functionality
 */
async function fetchCustomQuizzes(
  userId: string,
  limit: number = 12,
  offset: number = 0
): Promise<{ quizzes: CustomQuiz[]; total: number; hasMore: boolean }> {
  try {
    // OPTIMIZATION: Fetch quizzes and count in parallel - single round-trip optimization
    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where: {
          quizType: 'CUSTOM',
          createdByUserId: userId,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          blurb: true,
          colorHex: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.quiz.count({
        where: {
          quizType: 'CUSTOM',
          createdByUserId: userId,
        },
      }),
    ])

    const transformedQuizzes = quizzes.map(quiz => ({
      id: quiz.id,
      slug: quiz.slug || '',
      title: quiz.title,
      blurb: quiz.blurb || undefined,
      colorHex: quiz.colorHex || undefined,
      status: quiz.status,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
    }))

    return {
      quizzes: transformedQuizzes,
      total,
      hasMore: offset + quizzes.length < total,
    }
  } catch (error) {
    console.error('Error fetching custom quizzes:', error)
    return { quizzes: [], total: 0, hasMore: false }
  }
}

/**
 * Main function to fetch all data needed for the Quizzes page
 * OPTIMIZATION: Removed quizSlugs parameter - fetch all completions instead
 * Cached per user to avoid repeated database queries
 */
export async function getQuizzesPageData(): Promise<QuizzesPageData> {
  const session = await getSession()
  const user = session?.user

  if (!user) {
    return {
      completions: {},
      customQuizzes: [],
      customQuizzesTotal: 0,
      customQuizzesHasMore: false,
      isPremium: false,
      userName: null,
      isLoggedIn: false,
    }
  }

  // Check premium status - session.user.tier is already calculated in auth package
  const isPremium = user.tier === 'premium'

  // OPTIMIZATION: Cache key only includes user ID - quiz list is static
  const cacheKey = `quizzes-page-${user.id}`

  // Use cached version - revalidate every 30 seconds
  return unstable_cache(
    async () => {
      // OPTIMIZATION: Fetch completions without slug filter - only returns existing completions
      // OPTIMIZATION: Fetch only first 12 custom quizzes initially (pagination)
      // Fetch completions and custom quizzes in parallel
      const [completions, customQuizzesData] = await Promise.all([
        fetchCompletions(user.id),
        isPremium ? fetchCustomQuizzes(user.id, 12, 0) : Promise.resolve({ quizzes: [], total: 0, hasMore: false }),
      ])

      return {
        completions,
        customQuizzes: customQuizzesData.quizzes,
        customQuizzesTotal: customQuizzesData.total,
        customQuizzesHasMore: customQuizzesData.hasMore,
        isPremium,
        userName: user.name || user.email?.split('@')[0] || null,
        isLoggedIn: true,
      }
    },
    [cacheKey],
    {
      revalidate: 30, // Cache for 30 seconds
      tags: [`quizzes-page-${user.id}`], // Tag for potential invalidation
    }
  )()
}

