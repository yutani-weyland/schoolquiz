import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

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

/**
 * GET /api/premium/custom-quizzes/[id]/shares
 * Get list of users this quiz is shared with (owner only)
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
        { error: 'Only premium users can view shares' },
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
          { error: 'Quiz not found or you do not have permission to view shares' },
          { status: 404 }
        )
      }

      // Get shares
      const shares = await prisma.customQuizShare.findMany({
        where: {
          quizId: id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              tier: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({
        shares: shares.map(s => s.user),
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
    console.error('Error fetching quiz shares:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shares', details: error.message },
      { status: 500 }
    )
  }
}

