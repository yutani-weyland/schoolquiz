import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { getDummyQuizDetail } from '@/lib/dummy-quiz-data'

/**
 * GET /api/admin/quizzes/[id]
 * Get quiz details (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Add proper admin role check

    const { id } = await params

    // For testing: Always use dummy data
    // TODO: Switch to database when ready
    console.log('Using dummy data for quiz detail')
    const quiz = getDummyQuizDetail(id)
    
    // If not found, return 404
    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ quiz })
  } catch (error: any) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz', details: error.message },
      { status: 500 }
    )
  }
}

