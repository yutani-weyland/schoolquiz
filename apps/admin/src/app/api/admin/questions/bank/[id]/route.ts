import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { validateRequest, validateParams } from '@/lib/api-validation'
import { CreateQuestionSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api-error'
import { z } from 'zod'

const ParamsSchema = z.object({ id: z.string().min(1) })

/**
 * GET /api/admin/questions/bank/[id]
 * Get a specific question by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await validateParams(await params, ParamsSchema)

    try {
      const question = await prisma.question.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (!question) {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        )
      }

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
      })
    } catch (dbError: any) {
      throw dbError
    }
  } catch (error: any) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/admin/questions/bank/[id]
 * Update a question
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await validateParams(await params, ParamsSchema)
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

      // Update question in database
      const question = await prisma.question.update({
        where: { id },
        data: {
          text: text.trim(),
          answer: answer.trim(),
          explanation: explanation?.trim() || null,
          categoryId,
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

      console.log(`✅ Updated question ${question.id} in database`)

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
      })
    } catch (dbError: any) {
      if (dbError.code === 'P2025') {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        )
      }
      throw dbError
    }
  } catch (error: any) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/admin/questions/bank/[id]
 * Delete a question
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await validateParams(await params, ParamsSchema)

    try {
      await prisma.question.delete({
        where: { id },
      })

      console.log(`✅ Deleted question ${id} from database`)

      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      if (dbError.code === 'P2025') {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        )
      }
      throw dbError
    }
  } catch (error: any) {
    return handleApiError(error)
  }
}

