import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { z } from 'zod'

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  let userId: string | null = request.headers.get('X-User-Id')
  
  if (!userId && token.startsWith('mock-token-')) {
    const parts = token.split('-')
    if (parts.length >= 3) {
      userId = parts.slice(2, -1).join('-')
    }
  }

  if (!userId) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
      },
    })
    return user
  } catch (error: any) {
    const errorMsg = error.message || String(error)
    if (errorMsg.includes('does not exist') || 
        errorMsg.includes('P2022') ||
        errorMsg.includes('column')) {
      try {
        const user = await (prisma as any).user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            tier: true,
          },
        })
        return user
      } catch (fallbackError) {
        return null
      }
    }
    throw error
  }
}

function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`
}

const UpdateCustomQuizSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  blurb: z.string().max(500).optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  status: z.enum(['draft', 'published']).optional(),
})

/**
 * GET /api/premium/custom-quizzes/[id]
 * Get a specific custom quiz
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isPremium = user.tier === 'premium' || 
      (user as any).subscriptionStatus === 'ACTIVE' ||
      (user as any).subscriptionStatus === 'TRIALING'
    
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Custom quizzes are only available to premium users' },
        { status: 403 }
      )
    }

    const { id } = await params

    try {
      // Get quiz - check if user owns it or has access via sharing
      const quiz = await prisma.quiz.findFirst({
        where: {
          id,
          quizType: 'CUSTOM',
          OR: [
            { createdByUserId: user.id },
            {
              shares: {
                some: {
                  userId: user.id,
                },
              },
            },
          ],
        },
        include: {
          rounds: {
            include: {
              questions: {
                include: {
                  question: true,
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { index: 'asc' },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (!quiz) {
        return NextResponse.json(
          { error: 'Quiz not found or access denied' },
          { status: 404 }
        )
      }

      const isOwner = quiz.createdByUserId === user.id

      return NextResponse.json({
        quiz: {
          id: quiz.id,
          slug: quiz.slug,
          title: quiz.title,
          blurb: quiz.blurb,
          colorHex: quiz.colorHex,
          schoolLogoUrl: quiz.schoolLogoUrl,
          brandHeading: quiz.brandHeading,
          brandSubheading: quiz.brandSubheading,
          status: quiz.status,
          createdAt: quiz.createdAt,
          updatedAt: quiz.updatedAt,
          isOwner,
          createdBy: quiz.user,
          rounds: quiz.rounds.map(round => ({
            id: round.id,
            index: round.index,
            title: round.title,
            blurb: round.blurb,
            questions: round.questions.map(qrq => ({
              id: qrq.question.id,
              text: qrq.question.text,
              answer: qrq.question.answer,
              explanation: qrq.question.explanation,
              order: qrq.order,
            })),
          })),
        },
      })
    } catch (dbError: any) {
      if (dbError.message?.includes('does not exist') || 
          dbError.message?.includes('column') ||
          dbError.code === 'P2022') {
        return NextResponse.json(
          { error: 'Database schema not migrated' },
          { status: 500 }
        )
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error fetching custom quiz:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom quiz', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/premium/custom-quizzes/[id]
 * Update a custom quiz (only owner can update)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isPremium = user.tier === 'premium' || 
      (user as any).subscriptionStatus === 'ACTIVE' ||
      (user as any).subscriptionStatus === 'TRIALING'
    
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Custom quizzes are only available to premium users' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Validate input
    const validationResult = UpdateCustomQuizSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    try {
      // Check ownership
      const quiz = await prisma.quiz.findFirst({
        where: {
          id,
          quizType: 'CUSTOM',
          createdByUserId: user.id,
        },
      })

      if (!quiz) {
        return NextResponse.json(
          { error: 'Quiz not found or you do not have permission to edit it' },
          { status: 404 }
        )
      }

      // Update quiz
      const updatedQuiz = await prisma.quiz.update({
        where: { id },
        data: validationResult.data,
        include: {
          rounds: {
            include: {
              questions: {
                include: {
                  question: true,
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { index: 'asc' },
          },
        },
      })

      return NextResponse.json({
        quiz: {
          id: updatedQuiz.id,
          slug: updatedQuiz.slug,
          title: updatedQuiz.title,
          blurb: updatedQuiz.blurb,
          colorHex: updatedQuiz.colorHex,
          status: updatedQuiz.status,
          updatedAt: updatedQuiz.updatedAt,
        },
      })
    } catch (dbError: any) {
      if (dbError.message?.includes('does not exist') || 
          dbError.message?.includes('column') ||
          dbError.code === 'P2022') {
        return NextResponse.json(
          { error: 'Database schema not migrated' },
          { status: 500 }
        )
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error updating custom quiz:', error)
    return NextResponse.json(
      { error: 'Failed to update custom quiz', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/premium/custom-quizzes/[id]
 * Delete a custom quiz (only owner can delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isPremium = user.tier === 'premium' || 
      (user as any).subscriptionStatus === 'ACTIVE' ||
      (user as any).subscriptionStatus === 'TRIALING'
    
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Custom quizzes are only available to premium users' },
        { status: 403 }
      )
    }

    const { id } = await params

    try {
      // Check ownership
      const quiz = await prisma.quiz.findFirst({
        where: {
          id,
          quizType: 'CUSTOM',
          createdByUserId: user.id,
        },
      })

      if (!quiz) {
        return NextResponse.json(
          { error: 'Quiz not found or you do not have permission to delete it' },
          { status: 404 }
        )
      }

      // Delete quiz (cascade will handle rounds, questions, shares)
      await prisma.quiz.delete({
        where: { id },
      })

      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      if (dbError.message?.includes('does not exist') || 
          dbError.message?.includes('column') ||
          dbError.code === 'P2022') {
        return NextResponse.json(
          { error: 'Database schema not migrated' },
          { status: 500 }
        )
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error deleting custom quiz:', error)
    return NextResponse.json(
      { error: 'Failed to delete custom quiz', details: error.message },
      { status: 500 }
    )
  }
}

