'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
/**
 * Server Action: Load more custom quizzes
 * OPTIMIZATION: Server action for pagination - avoids client-side API route
 * This reduces round-trips and keeps data fetching on the server
 * Inlines query logic to avoid circular dependencies
 */
export async function loadMoreCustomQuizzes(offset: number, limit: number = 12) {
  const session = await getSession()
  const user = session?.user

  if (!user || user.tier !== 'premium') {
    return { quizzes: [], hasMore: false, total: 0 }
  }

  try {
    // OPTIMIZATION: Inline query - fetch quizzes and count in parallel
    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where: {
          quizType: 'CUSTOM',
          createdByUserId: user.id,
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
          createdByUserId: user.id,
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
      hasMore: offset + quizzes.length < total,
      total,
    }
  } catch (error) {
    console.error('Error loading more custom quizzes:', error)
    return { quizzes: [], hasMore: false, total: 0 }
  }
}

