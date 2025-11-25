import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { z } from 'zod'
import { requireApiAuth } from '@/lib/api-auth'
import { ForbiddenError } from '@/lib/api-error'

function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`
}

const ShareQuizSchema = z.object({
  userIds: z.array(z.string()).min(1).max(50), // Max 50 users at once
})

/**
 * POST /api/premium/custom-quizzes/[id]/share
 * Share a custom quiz with other premium users
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiAuth()

    const isPremium = user.tier === 'premium' || 
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
    
    if (!isPremium) {
      throw new ForbiddenError('Custom quizzes are only available to premium users')
    }

    const { id } = await params
    const body = await request.json()

    // Validate input
    const validationResult = ShareQuizSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { userIds } = validationResult.data

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
          { error: 'Quiz not found or you do not have permission to share it' },
          { status: 404 }
        )
      }

      // Check usage limits
      const currentMonth = new Date().toISOString().substring(0, 7)
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
            id: generateId(),
            userId: user.id,
            monthYear: currentMonth,
            quizzesCreated: 0,
            quizzesShared: 0,
          },
        })
      }

      // Count new shares (excluding already shared users)
      const existingShares = await prisma.customQuizShare.findMany({
        where: {
          quizId: id,
          userId: { in: userIds },
        },
        select: { userId: true },
      })

      const existingUserIds = new Set(existingShares.map(s => s.userId))
      const newUserIds = userIds.filter(uid => !existingUserIds.has(uid))
      const newShareCount = newUserIds.length

      if (usage.quizzesShared + newShareCount > 20) {
        return NextResponse.json(
          { error: `Monthly sharing limit reached. You can share up to 20 times per month. You have ${20 - usage.quizzesShared} shares remaining.` },
          { status: 403 }
        )
      }

      // Verify all target users are premium
      const targetUsers = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          OR: [
            { tier: 'premium' },
            { subscriptionStatus: 'ACTIVE' },
            { subscriptionStatus: 'TRIALING' },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          tier: true,
        },
      })

      if (targetUsers.length !== userIds.length) {
        return NextResponse.json(
          { error: 'Some users are not premium users and cannot access custom quizzes' },
          { status: 400 }
        )
      }

      // Create shares
      const shares = await Promise.all(
        newUserIds.map(userId =>
          prisma.customQuizShare.create({
            data: {
              id: generateId(),
              quizId: id,
              userId,
              sharedBy: user.id,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          })
        )
      )

      // Update usage counter
      if (newShareCount > 0) {
        await prisma.customQuizUsage.update({
          where: { id: usage.id },
          data: { quizzesShared: usage.quizzesShared + newShareCount },
        })
      }

      return NextResponse.json({
        success: true,
        sharedWith: shares.map(s => s.user),
        alreadyShared: existingShares.map(s => s.userId),
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
    console.error('Error sharing custom quiz:', error)
    return NextResponse.json(
      { error: 'Failed to share custom quiz', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/premium/custom-quizzes/[id]/share
 * Remove sharing access for specific users
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiAuth()

    const isPremium = user.tier === 'premium' || 
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
    
    if (!isPremium) {
      throw new ForbiddenError('Custom quizzes are only available to premium users')
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userIdsParam = searchParams.get('userIds')
    
    if (!userIdsParam) {
      return NextResponse.json(
        { error: 'userIds query parameter is required' },
        { status: 400 }
      )
    }

    const userIds = userIdsParam.split(',').filter(Boolean)

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
          { error: 'Quiz not found or you do not have permission to manage sharing' },
          { status: 404 }
        )
      }

      // Remove shares
      await prisma.customQuizShare.deleteMany({
        where: {
          quizId: id,
          userId: { in: userIds },
        },
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
    console.error('Error removing share:', error)
    return NextResponse.json(
      { error: 'Failed to remove share', details: error.message },
      { status: 500 }
    )
  }
}

