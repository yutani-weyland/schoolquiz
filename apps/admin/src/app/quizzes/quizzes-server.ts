import { getCurrentUser } from '@/lib/auth'
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

export interface QuizzesPageData {
  completions: Record<string, QuizCompletion>
  customQuizzes: CustomQuiz[]
  isPremium: boolean
  userName: string | null
  isLoggedIn: boolean
}

/**
 * Fetch all quiz completions for a user
 */
async function fetchCompletions(userId: string, quizSlugs: string[]): Promise<Record<string, QuizCompletion>> {
  try {
    const completions = await prisma.quizCompletion.findMany({
      where: {
        userId,
        quizSlug: {
          in: quizSlugs,
        },
      },
      select: {
        quizSlug: true,
        score: true,
        totalQuestions: true,
        completedAt: true,
      },
    })

    const completionMap: Record<string, QuizCompletion> = {}
    for (const completion of completions) {
      completionMap[completion.quizSlug] = {
        quizSlug: completion.quizSlug,
        score: completion.score,
        totalQuestions: completion.totalQuestions,
        completedAt: completion.completedAt.toISOString(),
      }
    }

    return completionMap
  } catch (error) {
    console.error('Error fetching completions:', error)
    // Return empty map if there's an error (table might not exist)
    return {}
  }
}

/**
 * Fetch custom quizzes for a premium user
 */
async function fetchCustomQuizzes(userId: string): Promise<CustomQuiz[]> {
  try {
    const quizzes = await prisma.quiz.findMany({
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
    })

    return quizzes.map(quiz => ({
      id: quiz.id,
      slug: quiz.slug,
      title: quiz.title,
      blurb: quiz.blurb || undefined,
      colorHex: quiz.colorHex || undefined,
      status: quiz.status,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
    }))
  } catch (error) {
    console.error('Error fetching custom quizzes:', error)
    return []
  }
}

/**
 * Main function to fetch all data needed for the Quizzes page
 * Cached per user to avoid repeated database queries
 */
export async function getQuizzesPageData(quizSlugs: string[]): Promise<QuizzesPageData> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      completions: {},
      customQuizzes: [],
      isPremium: false,
      userName: null,
      isLoggedIn: false,
    }
  }

  // Check premium status
  const isPremium = user.tier === 'premium' || 
    user.subscriptionStatus === 'ACTIVE' ||
    user.subscriptionStatus === 'TRIALING' ||
    (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())

  // Cache key includes user ID to ensure per-user caching
  // Quiz slugs are included in key since completions are per-quiz
  const cacheKey = `quizzes-page-${user.id}-${quizSlugs.join(',')}`
  
  // Use cached version - revalidate every 30 seconds
  return unstable_cache(
    async () => {
      // Fetch completions and custom quizzes in parallel
      const [completions, customQuizzes] = await Promise.all([
        fetchCompletions(user.id, quizSlugs),
        isPremium ? fetchCustomQuizzes(user.id) : Promise.resolve([]),
      ])

      return {
        completions,
        customQuizzes,
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

