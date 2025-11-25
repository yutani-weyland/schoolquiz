import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireApiUserId } from '@/lib/api-auth'

/**
 * GET /api/quiz/completions/batch?quizSlugs=1,2,3,4
 * Get completion data for multiple quizzes in a single request
 * Much more efficient than making individual requests for each quiz
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireApiUserId()
    const quizSlugsParam = request.nextUrl.searchParams.get('quizSlugs')

    if (!quizSlugsParam) {
      return NextResponse.json(
        { error: 'Missing required query parameter: quizSlugs (comma-separated)' },
        { status: 400 }
      )
    }

    // Parse comma-separated quiz slugs
    const quizSlugs = quizSlugsParam
      .split(',')
      .map(slug => slug.trim())
      .filter(Boolean)

    if (quizSlugs.length === 0) {
      return NextResponse.json({ completions: {} })
    }

    // Fetch all completions in a single query
    let completions: any[] = []
    try {
      completions = await prisma.quizCompletion.findMany({
        where: {
          userId,
          quizSlug: { in: quizSlugs },
        },
        select: {
          quizSlug: true,
          score: true,
          totalQuestions: true,
          completedAt: true,
        },
      })
    } catch (dbError: any) {
      // If table doesn't exist, return empty object
      const errorMessage = dbError.message?.toLowerCase() || ''
      const isTableMissing =
        dbError.code === 'P2021' ||
        dbError.code === '42P01' ||
        errorMessage.includes('does not exist') ||
        (errorMessage.includes('relation') && errorMessage.includes('does not exist'))

      if (isTableMissing) {
        return NextResponse.json({ completions: {} })
      }

      return NextResponse.json(
        {
          error: 'Database error when fetching completions',
          details: dbError.message || 'Unknown database error',
        },
        { status: 500 }
      )
    }

    // Convert array to object keyed by quizSlug for easy lookup
    const completionsMap: Record<string, any> = {}
    completions.forEach(completion => {
      completionsMap[completion.quizSlug] = {
        score: completion.score,
        totalQuestions: completion.totalQuestions,
        completedAt: completion.completedAt,
      }
    })

    return NextResponse.json({ completions: completionsMap })
  } catch (error: any) {
    console.error('Error fetching batch completions:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch completions',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

