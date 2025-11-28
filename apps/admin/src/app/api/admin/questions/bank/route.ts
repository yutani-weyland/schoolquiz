import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { validateQuery } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-error'
import { z } from 'zod'

const QuestionsBankQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  sortBy: z.enum(['question', 'answer', 'category', 'updatedAt']).default('updatedAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
})

/**
 * GET /api/admin/questions/bank
 * List questions in the bank with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const query = await validateQuery(request, QuestionsBankQuerySchema)
    const search = query.search || ''
    const categoryId = query.categoryId || ''
    const sortBy = query.sortBy || 'updatedAt'
    const sortOrder = query.sortOrder || 'desc'

    try {
      // Build where clause
      const where: any = {}
      
      if (categoryId) {
        where.categoryId = categoryId
      }
      
      if (search) {
        where.OR = [
          { text: { contains: search, mode: 'insensitive' } },
          { answer: { contains: search, mode: 'insensitive' } },
          { explanation: { contains: search, mode: 'insensitive' } },
        ]
      }

      // Build orderBy clause
      const orderBy: any = {}
      switch (sortBy) {
        case 'question':
          orderBy.text = sortOrder === 'asc' ? 'asc' : 'desc'
          break
        case 'answer':
          orderBy.answer = sortOrder === 'asc' ? 'asc' : 'desc'
          break
        case 'category':
          // Note: Prisma doesn't support sorting by related fields directly
          // We'll sort by categoryId instead, or handle it in memory
          orderBy.categoryId = sortOrder === 'asc' ? 'asc' : 'desc'
          break
        case 'updatedAt':
        default:
          orderBy.updatedAt = sortOrder === 'asc' ? 'asc' : 'desc'
          break
      }

      // Fetch questions from database with quiz usage information
      const questions = await prisma.question.findMany({
        where,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          rounds: {
            include: {
              round: {
                include: {
                  quiz: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      // Transform to match expected format
      const formattedQuestions = questions.map(q => {
        // Get the first quiz this question is used in (if any)
        const quizUsage = q.rounds.length > 0 
          ? q.rounds[0].round.quiz 
          : null

        return {
          id: q.id,
          text: q.text,
          answer: q.answer,
          explanation: q.explanation || undefined,
          categoryId: q.categoryId,
            categoryName: q.category?.name || 'Uncategorized',
          createdAt: q.createdAt.toISOString(),
          updatedAt: q.updatedAt.toISOString(),
          usedInQuiz: quizUsage ? {
            id: quizUsage.id,
            title: quizUsage.title,
            slug: quizUsage.slug,
          } : null,
        }
      })

      console.log(`✅ Fetched ${questions.length} questions from database`)

      return NextResponse.json({ questions: formattedQuestions })
    } catch (dbError: any) {
      // Fallback to dummy data if database is not available
      console.log('Database not available, using dummy data for question bank')
      
      const dummyQuestions = [
        {
          id: 'q1',
          text: 'What year did World War II end?',
          answer: '1945',
          explanation: 'World War II ended in 1945 with the surrender of Japan.',
          categoryId: 'cat-2',
          categoryName: 'WW2 History',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          usedInQuiz: {
            id: 'quiz-1',
            title: 'Week 1 Quiz',
            slug: 'week-1-quiz',
          },
        },
        {
          id: 'q2',
          text: 'What is the capital of Western Australia?',
          answer: 'Perth',
          explanation: 'Perth is the capital and largest city of Western Australia.',
          categoryId: 'cat-4',
          categoryName: 'Geography',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          usedInQuiz: null,
        },
        {
          id: 'q3',
          text: 'Who was the first Prime Minister of Australia?',
          answer: 'Edmund Barton',
          explanation: 'Edmund Barton became the first Prime Minister of Australia in 1901.',
          categoryId: 'cat-3',
          categoryName: 'Australian History',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          usedInQuiz: null,
        },
      ]

      let filtered = [...dummyQuestions]

      // Apply filters
      if (search) {
        const searchLower = search.toLowerCase()
        filtered = filtered.filter(q =>
          q.text.toLowerCase().includes(searchLower) ||
          q.answer.toLowerCase().includes(searchLower) ||
          (q.explanation && q.explanation.toLowerCase().includes(searchLower))
        )
      }

      if (categoryId) {
        filtered = filtered.filter(q => q.categoryId === categoryId)
      }

      // Sort by updatedAt descending (most recent first)
      filtered.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )

      return NextResponse.json({ questions: filtered })
    }
  } catch (error: any) {
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/questions/bank
 * Create a new question in the bank
 */
export async function POST(request: NextRequest) {
  try {
    const { validateRequest } = await import('@/lib/api-validation')
    const { CreateQuestionSchema } = await import('@/lib/validation/schemas')
    
    // Validate request body with Zod
    const body = await validateRequest(request, CreateQuestionSchema)
    const { text, answer, explanation, categoryId } = body

    try {
      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true },
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }

      // Create question in database
      // Note: createdBy is required in the schema, but we don't have auth yet
      // For now, we'll use a placeholder. In production, use the authenticated user's ID
      const question = await prisma.question.create({
        data: {
          text: text.trim(),
          answer: answer.trim(),
          explanation: explanation?.trim() || null,
          categoryId,
          difficulty: 0.5, // Default difficulty
          status: 'draft',
          createdBy: 'system', // TODO: Replace with actual user ID from auth
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      console.log(`✅ Created question ${question.id} in database`)

      return NextResponse.json({
        question: {
          id: question.id,
          text: question.text,
          answer: question.answer,
          explanation: question.explanation || undefined,
          categoryId: question.categoryId,
          categoryName: question.category?.name || 'Uncategorized',
          createdAt: question.createdAt.toISOString(),
          updatedAt: question.updatedAt.toISOString(),
        },
      }, { status: 201 })
    } catch (dbError: any) {
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Question already exists' },
          { status: 409 }
        )
      }
      throw dbError
    }
  } catch (error: any) {
    return handleApiError(error)
  }
}

