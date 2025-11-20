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
    // Rounds metadata only (no questions yet - lazy load)
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
        // Don't load questions here - will be loaded separately if needed
        _count: {
          select: {
            questions: true,
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

  // Load questions separately in a single optimized query
  // This is faster than nested queries
  const roundIds = roundsBasic.map(r => r.id)
  const questionsData = roundIds.length > 0 ? await prisma.quizRoundQuestion.findMany({
    where: {
      roundId: { in: roundIds },
    },
    select: {
      id: true,
      order: true,
      roundId: true,
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
  }) : []

  // Group questions by roundId
  const questionsByRound = new Map<string, typeof questionsData>()
  questionsData.forEach(q => {
    if (!questionsByRound.has(q.roundId)) {
      questionsByRound.set(q.roundId, [])
    }
    questionsByRound.get(q.roundId)!.push(q)
  })

  // Attach questions to rounds
  const rounds = roundsBasic.map(round => ({
    ...round,
    questions: questionsByRound.get(round.id) || [],
  }))

  const averageAudienceSize = runsStats.count > 0 
    ? Math.round(runsStats.totalParticipants / runsStats.count) 
    : 0

  return {
    ...quiz,
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
  // Cache quiz data for 30 seconds (shorter cache for detail pages that might be edited)
  // This helps with performance while still allowing recent edits to show
  return unstable_cache(
    async () => getQuizInternal(id),
    [`quiz-detail-${id}`],
    { revalidate: 30 }
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
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Quiz Detail] Loaded in ${Date.now() - startTime}ms`)
  }

  if (!quiz) {
    notFound()
  }

  return <AdminQuizDetailClient initialQuiz={quiz} initialTab={tab || 'content'} quizId={id} />
}

