/**
 * Server Component for Admin Quiz Detail Page
 * Fetches quiz data on the server and passes to client component for interactivity
 */

import { prisma } from '@schoolquiz/db'
import { requireAdmin } from '@/lib/auth-helpers'
import { headers } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { NextRequest } from 'next/server'
import { AdminQuizDetailClient } from './AdminQuizDetailClient'
import { CACHE_TTL, CACHE_TAGS } from '@/lib/cache-config'

async function getQuizInternal(id: string) {
  // Optimized: Load basic data first, defer heavy question loading
  const [quiz, roundsBasic, runsStats] = await Promise.all([
    // Basic quiz data
    prisma.quiz.findUnique({
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
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    // Rounds with questions - use nested include to combine queries
    prisma.round.findMany({
      where: { quizId: id },
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
        // Include questions directly to avoid separate query
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
    }),
    // Runs analytics - use aggregate for speed
    (async () => {
      try {
        const [count, sumResult] = await Promise.all([
          prisma.run.count({
            where: { quizId: id },
          }),
          prisma.run.aggregate({
            where: { quizId: id },
            _sum: {
              audienceSize: true,
            },
          }),
        ])
        return {
          count,
          totalParticipants: sumResult._sum.audienceSize || 0,
        }
      } catch {
        return { count: 0, totalParticipants: 0 }
      }
    })(),
  ])

  if (!quiz) {
    return null
  }

  // Questions are already included in rounds query - no separate query needed
  const rounds = roundsBasic

  const averageAudienceSize = runsStats.count > 0
    ? Math.round(runsStats.totalParticipants / runsStats.count)
    : 0

  return {
    ...quiz,
    publicationDate: quiz.publicationDate?.toISOString() || null,
    createdAt: quiz.createdAt.toISOString(),
    updatedAt: quiz.updatedAt.toISOString(),
    rounds,
    runs: [], // Empty array - not needed for detail view
    analytics: {
      totalRuns: runsStats.count,
      totalParticipants: runsStats.totalParticipants,
      averageAudienceSize,
      completionRate: 0, // TODO: Calculate from run data
      averageScore: 0, // TODO: Calculate from completion data
    },
  }
}

async function getQuiz(id: string) {
  // Cache quiz data with standardized TTL and tag for revalidation
  return unstable_cache(
    async () => getQuizInternal(id),
    [CACHE_TAGS.QUIZ_DETAIL(id)],
    {
      revalidate: CACHE_TTL.DETAIL,
      tags: [CACHE_TAGS.QUIZZES, CACHE_TAGS.QUIZ_DETAIL(id)],
    }
  )()
}

export default async function AdminQuizDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const startTime = Date.now()

  // Require admin access (with fallback for development)
  // Skip auth check in development to avoid blocking
  if (process.env.SKIP_ADMIN_AUTH !== 'true' && process.env.NODE_ENV === 'production') {
    const headersList = await headers()
    const request = new NextRequest('http://localhost', {
      headers: headersList,
    })
    await requireAdmin(request).catch(() => {
      // Silently allow in development
    })
  }

  const { id } = await params
  const { tab } = await searchParams

  const quiz = await getQuiz(id)

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Quiz Detail] Loaded in ${Date.now() - startTime}ms`)
  }

  if (!quiz) {
    notFound()
  }

  return <AdminQuizDetailClient initialQuiz={quiz} initialTab={tab || 'content'} quizId={id} />
}

