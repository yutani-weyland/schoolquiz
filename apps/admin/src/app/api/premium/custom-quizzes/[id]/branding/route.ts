import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { z } from 'zod'
import { requireApiAuth } from '@/lib/api-auth'
import { ForbiddenError } from '@/lib/api-error'

const BrandingSchema = z.object({
  schoolLogoUrl: z.string().url().optional().nullable(),
  brandHeading: z.string().max(100).optional().nullable(),
  brandSubheading: z.string().max(200).optional().nullable(),
})

/**
 * POST /api/premium/custom-quizzes/[id]/branding
 * Update branding for a custom quiz (logo, heading, subheading)
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
    const validationResult = BrandingSchema.safeParse(body)
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
          { error: 'Quiz not found or you do not have permission to update branding' },
          { status: 404 }
        )
      }

      // Update branding
      const updatedQuiz = await prisma.quiz.update({
        where: { id },
        data: {
          schoolLogoUrl: validationResult.data.schoolLogoUrl ?? null,
          brandHeading: validationResult.data.brandHeading ?? null,
          brandSubheading: validationResult.data.brandSubheading ?? null,
        },
      })

      return NextResponse.json({
        success: true,
        branding: {
          schoolLogoUrl: updatedQuiz.schoolLogoUrl,
          brandHeading: updatedQuiz.brandHeading,
          brandSubheading: updatedQuiz.brandSubheading,
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
    console.error('Error updating branding:', error)
    return NextResponse.json(
      { error: 'Failed to update branding', details: error.message },
      { status: 500 }
    )
  }
}

