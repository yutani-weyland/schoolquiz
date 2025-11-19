import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { getDummyQuizDetail, dummyQuizzes } from '@/lib/dummy-quiz-data'
import { getQuizColor as getStoredColor, setQuizColor, hasQuizColor } from '@/lib/quiz-color-store'

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

    // Override colorHex if it was updated
    if (hasQuizColor(id)) {
      quiz.colorHex = getStoredColor(id)!
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

/**
 * PATCH /api/admin/quizzes/[id]
 * Update quiz (admin only)
 */
export async function PATCH(
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
    const body = await request.json()

    // For testing: Store in memory
    // TODO: Switch to database when ready
    const quiz = dummyQuizzes.find(q => q.id === id)
    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Update colorHex if provided
    if (body.colorHex !== undefined) {
      // Validate hex color format
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      if (body.colorHex && !hexRegex.test(body.colorHex)) {
        return NextResponse.json(
          { error: 'Invalid color format. Must be a valid hex color (e.g., #FFE135)' },
          { status: 400 }
        )
      }
      setQuizColor(id, body.colorHex)
      quiz.colorHex = body.colorHex
    }

    // TODO: Update other fields when switching to real DB
    // await prisma.quiz.update({
    //   where: { id },
    //   data: { colorHex: body.colorHex }
    // })

    const updatedQuiz = getDummyQuizDetail(id)
    if (updatedQuiz && hasQuizColor(id)) {
      updatedQuiz.colorHex = getStoredColor(id)!
    }

    return NextResponse.json({ quiz: updatedQuiz })
  } catch (error: any) {
    console.error('Error updating quiz:', error)
    return NextResponse.json(
      { error: 'Failed to update quiz', details: error.message },
      { status: 500 }
    )
  }
}

