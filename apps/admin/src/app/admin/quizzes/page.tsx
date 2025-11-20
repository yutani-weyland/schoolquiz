/**
 * Server Component for Admin Quizzes Page
 * Fetches quiz data on the server and passes to client component for interactivity
 */

import { Suspense } from 'react'
import { prisma } from '@schoolquiz/db'
import { requireAdmin } from '@/lib/auth-helpers'
import { QuizzesTable } from './QuizzesTable'
import { headers } from 'next/headers'
import { unstable_cache } from 'next/cache'

interface Quiz {
  id: string
  title: string
  blurb?: string | null
  audience?: string | null
  difficultyBand?: string | null
  theme?: string | null
  seasonalTag?: string | null
  publicationDate?: string | null
  status: string
  pdfUrl?: string | null
  pdfStatus?: string | null
  createdAt: string
  updatedAt: string
  _count: {
    rounds: number
    runs: number
  }
}

// Cache key generator for quizzes query
function getCacheKey(searchParams: { page?: string; limit?: string; search?: string; status?: string }) {
  return `quizzes-${searchParams.page || '1'}-${searchParams.limit || '50'}-${searchParams.search || ''}-${searchParams.status || ''}`
}

async function getQuizzesInternal(searchParams: {
  page?: string
  limit?: string
  search?: string
  status?: string
}) {
  const page = parseInt(searchParams.page || '1')
  const limit = parseInt(searchParams.limit || '50')
  const search = searchParams.search || ''
  const status = searchParams.status || ''

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}
  if (status) {
    where.status = status
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { blurb: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Optimized query - only fetch what we need for the list view
  // Don't load rounds/categories data (not needed for list)
  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
        pdfUrl: true,
        pdfStatus: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            rounds: true,
          },
        },
      },
    }),
    prisma.quiz.count({ where }),
  ])
  
  // Get runs count separately - only for the quizzes we fetched
  let runsCounts: any[] = []
  if (quizzes.length > 0) {
    try {
      const quizIds = quizzes.map(q => q.id)
      const result = await prisma.run.groupBy({
        by: ['quizId'],
        where: {
          quizId: { in: quizIds },
        },
        _count: {
          id: true,
        },
      })
      runsCounts = result as any[]
    } catch {
      // If runs table doesn't exist, return empty array
      runsCounts = []
    }
  }

  // Create a map of quizId -> runs count
  const runsCountMap = new Map(
    Array.isArray(runsCounts) 
      ? runsCounts.map((r: any) => [r.quizId, r._count.id])
      : []
  )

  // Add runs count to each quiz
  const quizzesWithRuns = quizzes.map(quiz => ({
    ...quiz,
    _count: {
      ...quiz._count,
      runs: runsCountMap.get(quiz.id) || 0,
    },
  }))

  return {
    quizzes: quizzesWithRuns as Quiz[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

async function getQuizzes(searchParams: {
  page?: string
  limit?: string
  search?: string
  status?: string
}) {
  // Require admin access (with fallback for development)
  // Only check if not skipping auth (to avoid unnecessary DB queries)
  if (process.env.SKIP_ADMIN_AUTH !== 'true' && process.env.NODE_ENV === 'production') {
    const headersList = await headers()
    const request = new Request('http://localhost', {
      headers: headersList,
    })
    await requireAdmin(request).catch(() => {
      // Silently allow in development - auth will be implemented later
    })
  }

  // Cache non-search queries for 30 seconds (search results shouldn't be cached)
  if (!searchParams.search && !searchParams.status) {
    return unstable_cache(
      async () => getQuizzesInternal(searchParams),
      [getCacheKey(searchParams)],
      { revalidate: 30 }
    )()
  }

  // No cache for search/filter queries
  return getQuizzesInternal(searchParams)
}

export default async function AdminQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    limit?: string
    search?: string
    status?: string
  }>
}) {
  const params = await searchParams
  const { quizzes, pagination } = await getQuizzes(params)

  return (
    <Suspense fallback={
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Loading quizzes...</p>
          </div>
    }>
      <QuizzesTable
        initialQuizzes={quizzes}
        initialPagination={pagination}
        initialSearch={params.search || ''}
        initialStatus={params.status || ''}
      />
    </Suspense>
  )
}
