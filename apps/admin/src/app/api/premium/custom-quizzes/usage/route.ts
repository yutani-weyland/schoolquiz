import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireApiAuth } from '@/lib/api-auth'
import { ForbiddenError } from '@/lib/api-error'

/**
 * GET /api/premium/custom-quizzes/usage
 * Get usage limits and current usage for the current month
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireApiAuth()

    const isPremium = user.tier === 'premium' || 
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
    
    if (!isPremium) {
      throw new ForbiddenError('Custom quizzes are only available to premium users')
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

