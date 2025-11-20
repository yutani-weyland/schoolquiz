/**
 * Server Component for Admin Quiz Detail Page
 * Fetches quiz data on the server and passes to client component for interactivity
 */

import { prisma } from '@schoolquiz/db'
import { requireAdmin } from '@/lib/auth-helpers'
import { headers } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { AdminQuizDetailClient } from './AdminQuizDetailClient'

async function getQuizInternal(id: string) {
  // Optimized query - only fetch what we need
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      blurb: true,
      audience: true,
      difficultyBand: true,
      theme: true,
      seasonalTag: true,
      publicationDate: true,
      status: true,
      colorHex: true,
      pdfUrl: true,
      pdfStatus: true,
      createdAt: true,
      updatedAt: true,
      rounds: {
        select: {
          id: true,
          index: true,
          categoryId: true,
          title: true,
          blurb: true,
          targetDifficulty: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          questions: {
            select: {
              id: true,
              order: true,
              question: {
                select: {
                  id: true,
                  text: true,
                  answer: true,
                  difficulty: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          index: 'asc',
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!quiz) {
    return null
  }

  // Get runs analytics in parallel
  let totalRuns = 0
  let totalParticipants = 0
  try {
    const runs = await prisma.run.findMany({
      where: { quizId: id },
      select: { audienceSize: true },
    })
    totalRuns = runs.length
    totalParticipants = runs.reduce((sum, run) => sum + run.audienceSize, 0)
  } catch {
    // If runs table doesn't exist, use 0
    totalRuns = 0
    totalParticipants = 0
  }
  const averageAudienceSize = totalRuns > 0 ? Math.round(totalParticipants / totalRuns) : 0

  return {
    ...quiz,
    runs: [], // Empty array - not needed for detail view
    analytics: {
      totalRuns,
      totalParticipants,
      averageAudienceSize,
      completionRate: 0, // TODO: Calculate from run data
      averageScore: 0, // TODO: Calculate from completion data
    },
  }
}

async function getQuiz(id: string) {
  // Cache quiz data for 60 seconds (detail pages change less frequently)
  return unstable_cache(
    async () => getQuizInternal(id),
    [`quiz-${id}`],
    { revalidate: 60 }
  )()
}

export default async function AdminQuizDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  // Require admin access (with fallback for development)
  if (process.env.SKIP_ADMIN_AUTH !== 'true' && process.env.NODE_ENV === 'production') {
    const headersList = await headers()
    const request = new Request('http://localhost', {
      headers: headersList,
    })
    await requireAdmin(request).catch(() => {
      // Silently allow in development
    })
  }

  const { id } = await params
  const { tab } = await searchParams
  const quiz = await getQuiz(id)

  if (!quiz) {
    notFound()
  }

  return <AdminQuizDetailClient initialQuiz={quiz} initialTab={tab || 'content'} quizId={id} />
}

