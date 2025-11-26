import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { prisma } from '@schoolquiz/db'
import { z } from 'zod'
import { requireApiAuth } from '@/lib/api-auth'
import { ForbiddenError } from '@/lib/api-error'

function generateSlug(title: string, userId: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
  const timestamp = Date.now().toString(36)
  return `custom-${userId.substring(0, 8)}-${baseSlug}-${timestamp}`
}

function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`
}

// Validation schemas
const RoundSchema = z.object({
  title: z.string().max(100).optional(),
  blurb: z.string().max(300).optional(),
  questions: z.array(
    z.object({
      text: z.string().min(10).max(500),
      answer: z.string().min(1).max(200),
      explanation: z.string().max(500).optional(),
    })
  ).min(1).max(20),
})

const CreateCustomQuizSchema = z.object({
  title: z.string().min(3).max(100),
  blurb: z.string().max(500).optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  rounds: z.array(RoundSchema).min(1).max(10),
  // Validate total questions
}).refine(
  (data) => {
    const totalQuestions = data.rounds.reduce((sum, round) => sum + round.questions.length, 0)
    return totalQuestions >= 1 && totalQuestions <= 100
  },
  { message: 'Total questions must be between 1 and 100' }
)

/**
 * GET /api/premium/custom-quizzes
 * Get all custom quizzes the user owns or has access to
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireApiAuth()

    // Check premium status
    const isPremium = user.tier === 'premium' ||
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())

    if (!isPremium) {
      throw new ForbiddenError('Custom quizzes are only available to premium users')
    }

    const { searchParams } = new URL(request.url)
    const includeShared = searchParams.get('includeShared') === 'true'

    try {
      // Get quizzes created by user
      // Cache the quiz fetching to improve performance
      // Revalidate when user creates/modifies quizzes (we'll need to add revalidateTag calls in mutations)
      const getCachedQuizzes = unstable_cache(
        async () => {
          // OPTIMIZATION: Fetch only metadata needed for list view (no rounds/questions)
          // This reduces payload by ~95% - list view doesn't need full quiz data
          const ownedQuizzes = await prisma.quiz.findMany({
            where: {
              quizType: 'CUSTOM',
              createdByUserId: user.id,
            },
            select: {
              id: true,
              slug: true,
              title: true,
              blurb: true,
              colorHex: true,
              schoolLogoUrl: true,
              brandHeading: true,
              brandSubheading: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  shares: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          })

          let sharedQuizzes: any[] = []
          if (includeShared) {
            // OPTIMIZATION: Fetch only metadata for shared quizzes
            const shares = await prisma.customQuizShare.findMany({
              where: {
                userId: user.id,
              },
              select: {
                quiz: {
                  select: {
                    id: true,
                    slug: true,
                    title: true,
                    blurb: true,
                    colorHex: true,
                    schoolLogoUrl: true,
                    brandHeading: true,
                    brandSubheading: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            })
            sharedQuizzes = shares.map(share => ({
              ...share.quiz,
              isShared: true,
              sharedBy: share.quiz.user,
              _count: { shares: 0 }, // Shared quizzes don't show share count
            }))
          }

          return { ownedQuizzes, sharedQuizzes }
        },
        [`custom-quizzes-${user.id}-${includeShared}`],
        {
          revalidate: 60, // Cache for 1 minute
          tags: [`custom-quizzes-${user.id}`]
        }
      )

      const { ownedQuizzes, sharedQuizzes } = await getCachedQuizzes()

      // OPTIMIZATION: Transform to API format (list view - metadata only)
      // Note: rounds/questions removed - only needed for detail view
      const transformQuiz = (quiz: any) => ({
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
        shareCount: quiz._count?.shares || 0,
        isShared: quiz.isShared || false,
        sharedBy: quiz.sharedBy || null,
      })

      return NextResponse.json({
        quizzes: [
          ...ownedQuizzes.map(transformQuiz),
          ...sharedQuizzes.map(transformQuiz),
        ],
      })
    } catch (dbError: any) {
      console.error('Database error:', dbError)
      // If schema not migrated yet, return empty array
      if (dbError.message?.includes('does not exist') ||
        dbError.message?.includes('column') ||
        dbError.code === 'P2022') {
        return NextResponse.json({ quizzes: [] })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error fetching custom quizzes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom quizzes', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/premium/custom-quizzes
 * Create a new custom quiz
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireApiAuth()

    // Check premium status
    const isPremium = user.tier === 'premium' ||
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())

    if (!isPremium) {
      throw new ForbiddenError('Custom quizzes are only available to premium users')
    }

    const body = await request.json()

    // Validate input
    const validationResult = CreateCustomQuizSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check usage limits
    const currentMonth = new Date().toISOString().substring(0, 7) // "2025-01"
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

    if (usage.quizzesCreated >= 10) {
      return NextResponse.json(
        { error: 'Monthly limit reached. You can create up to 10 custom quizzes per month.' },
        { status: 403 }
      )
    }

    // Check total stored quizzes
    const totalQuizzes = await prisma.quiz.count({
      where: {
        quizType: 'CUSTOM',
        createdByUserId: user.id,
      },
    })

    if (totalQuizzes >= 50) {
      return NextResponse.json(
        { error: 'Storage limit reached. You can store up to 50 custom quizzes. Please delete some before creating new ones.' },
        { status: 403 }
      )
    }

    try {
      // Create quiz
      const slug = generateSlug(data.title, user.id)
      const quiz = await prisma.quiz.create({
        data: {
          id: generateId(),
          slug,
          title: data.title,
          blurb: data.blurb || null,
          colorHex: data.colorHex,
          quizType: 'CUSTOM',
          createdByUserId: user.id,
          status: 'draft',
          // Create a default category for custom quizzes or use null
          // For now, we'll create rounds without requiring categories
        } as any,
      }) as any

      // Find or create a "Custom" category for custom quiz rounds
      let customCategory = await prisma.category.findFirst({
        where: { name: 'Custom' },
      })

      if (!customCategory) {
        // Create a default "Custom" category if it doesn't exist
        // Note: createdBy is required, so we'll use a system user or the first teacher
        const firstTeacher = await prisma.teacher.findFirst()
        if (!firstTeacher) {
          return NextResponse.json(
            { error: 'System error: No teacher found for category creation' },
            { status: 500 }
          )
        }

        customCategory = await prisma.category.create({
          data: {
            id: generateId(),
            name: 'Custom',
            description: 'Custom quiz category',
            createdBy: firstTeacher.id,
            isActive: true,
          },
        })
      }

      // Create rounds and questions
      for (let roundIndex = 0; roundIndex < data.rounds.length; roundIndex++) {
        const roundData = data.rounds[roundIndex]

        // Create round using the Custom category
        const round = await prisma.round.create({
          data: {
            id: generateId(),
            quizId: quiz.id,
            index: roundIndex,
            categoryId: customCategory.id,
            title: roundData.title || null,
            blurb: roundData.blurb || null,
            isPeoplesRound: false,
          },
        })

        // Create questions for this round
        for (let questionIndex = 0; questionIndex < roundData.questions.length; questionIndex++) {
          const questionData = roundData.questions[questionIndex]

          // Create question
          const question = await prisma.question.create({
            data: {
              id: generateId(),
              categoryId: null, // Custom quiz questions don't need categories
              text: questionData.text,
              answer: questionData.answer,
              explanation: questionData.explanation || null,
              difficulty: 0.5,
              status: 'published',
              createdByUserId: user.id,
              quizId: quiz.id,
              isCustom: true,
              isPeopleQuestion: false,
            },
          })

          // Link question to round
          await prisma.quizRoundQuestion.create({
            data: {
              id: generateId(),
              roundId: round.id,
              questionId: question.id,
              order: questionIndex,
            },
          })
        }
      }

      // Update usage counter
      await prisma.customQuizUsage.update({
        where: { id: usage.id },
        data: { quizzesCreated: usage.quizzesCreated + 1 },
      })

      // Fetch created quiz with relations
      const createdQuiz = await prisma.quiz.findUnique({
        where: { id: quiz.id },
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
          id: createdQuiz!.id,
          slug: createdQuiz!.slug,
          title: createdQuiz!.title,
          blurb: createdQuiz!.blurb,
          colorHex: createdQuiz!.colorHex,
          status: createdQuiz!.status,
          createdAt: createdQuiz!.createdAt,
          rounds: createdQuiz!.rounds.map(round => ({
            id: round.id,
            index: round.index,
            title: round.title,
            blurb: round.blurb,
            questions: round.questions.map(qrq => ({
              id: qrq.question.id,
              text: qrq.question.text,
              answer: qrq.question.answer,
              explanation: qrq.question.explanation,
            })),
          })),
        },
      }, { status: 201 })
    } catch (dbError: any) {
      console.error('Database error creating quiz:', dbError)
      // Handle schema not migrated
      if (dbError.message?.includes('does not exist') ||
        dbError.message?.includes('column') ||
        dbError.code === 'P2022') {
        return NextResponse.json(
          { error: 'Database schema not migrated. Please run migration 008_add_custom_quiz_support.sql' },
          { status: 500 }
        )
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error creating custom quiz:', error)
    return NextResponse.json(
      { error: 'Failed to create custom quiz', details: error.message },
      { status: 500 }
    )
  }
}

