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
 * GET /api/premium/custom-quizzes/usage
 * Get usage limits and current usage for the current month
 */
export async function GET(request: NextRequest) {
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

    const currentMonth = new Date().toISOString().substring(0, 7) // "2025-01"

    try {
      // Get or create usage record
      let usage = await prisma.customQuizUsage.findUnique({
        where: {
          userId_monthYear: {
            userId: user.id,
            monthYear: currentMonth,
          },
        },
      })

      if (!usage) {
        usage = await prisma.customQuizUsage.create({
          data: {
            id: `c${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            monthYear: currentMonth,
            quizzesCreated: 0,
            quizzesShared: 0,
          },
        })
      }

      // Get total stored quizzes
      const totalQuizzes = await prisma.quiz.count({
        where: {
          quizType: 'CUSTOM',
          createdByUserId: user.id,
        },
      })

      return NextResponse.json({
        currentMonth: {
          quizzesCreated: usage.quizzesCreated,
          quizzesShared: usage.quizzesShared,
          quizzesCreatedLimit: 10,
          quizzesSharedLimit: 20,
        },
        storage: {
          totalQuizzes,
          maxQuizzes: 50,
        },
        canCreate: usage.quizzesCreated < 10 && totalQuizzes < 50,
        canShare: usage.quizzesShared < 20,
      })
    } catch (dbError: any) {
      if (dbError.message?.includes('does not exist') || 
          dbError.message?.includes('column') ||
          dbError.code === 'P2022') {
        // Schema not migrated, return default limits
        return NextResponse.json({
          currentMonth: {
            quizzesCreated: 0,
            quizzesShared: 0,
            quizzesCreatedLimit: 10,
            quizzesSharedLimit: 20,
          },
          storage: {
            totalQuizzes: 0,
            maxQuizzes: 50,
          },
          canCreate: true,
          canShare: true,
        })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error fetching usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage', details: error.message },
      { status: 500 }
    )
  }
}

