import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'

/**
 * POST /api/admin/quizzes/builder
 * Create or update a quiz from the builder
 */
export async function POST(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { id, title, status, rounds, createdBy, colorHex } = body

    // For testing: Return success with dummy data
    // TODO: Implement actual database save
    console.log('Saving quiz:', { id, title, status, roundsCount: rounds?.length })

    // Validate structure
    if (!title || !rounds || rounds.length !== 5) {
      return NextResponse.json(
        { error: 'Invalid quiz structure. Must have 4 rounds + 1 people question.' },
        { status: 400 }
      )
    }

    // Validate each round
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i]
      const isPeoplesRound = i === 4
      
      if (!round.title || !round.categoryId) {
        return NextResponse.json(
          { error: `Round ${i + 1} is missing title or category` },
          { status: 400 }
        )
      }

      if (isPeoplesRound && round.questions.length !== 1) {
        return NextResponse.json(
          { error: 'People\'s round must have exactly 1 question' },
          { status: 400 }
        )
      }

      if (!isPeoplesRound && round.questions.length !== 6) {
        return NextResponse.json(
          { error: `Round ${i + 1} must have exactly 6 questions` },
          { status: 400 }
        )
      }

      // Validate questions
      for (const question of round.questions) {
        if (!question.text || !question.answer) {
          return NextResponse.json(
            { error: 'All questions must have text and answer' },
            { status: 400 }
          )
        }
      }
    }

    // TODO: Save to database
    // This would involve:
    // 1. Create/update Quiz
    // 2. Create/update Rounds
    // 3. Create/update Questions (checking for reuse)
    // 4. Link questions to rounds via QuizRoundQuestion
    // 5. Mark questions as used (isUsed = true) if quiz is published

    return NextResponse.json({
      quiz: {
        id: id || `quiz-${Date.now()}`,
        title,
        status,
        colorHex: colorHex || null,
        rounds: rounds.length,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error saving quiz:', error)
    return NextResponse.json(
      { error: 'Failed to save quiz', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/quizzes/builder/[id]
 * Get quiz data for editing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // TODO: Fetch from database
    // For now, return 404
    return NextResponse.json(
      { error: 'Quiz not found' },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz', details: error.message },
      { status: 500 }
    )
  }
}

