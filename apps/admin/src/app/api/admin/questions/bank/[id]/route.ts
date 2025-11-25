import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

/**
 * GET /api/admin/questions/bank/[id]
 * Get a specific question by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
      console.error('Database error fetching question:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch question', details: dbError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error fetching question:', error)
    return NextResponse.json(
      { error: 'Failed to fetch question', details: error.message },
      { status: 500 }
    )
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
    const { id } = await params
    const body = await request.json()
    const { text, answer, explanation, categoryId } = body

    if (!text || !answer || !categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields: text, answer, categoryId' },
        { status: 400 }
      )
    }

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
      console.error('Database error updating question:', dbError)
      return NextResponse.json(
        { error: 'Failed to update question', details: dbError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error updating question:', error)
    return NextResponse.json(
      { error: 'Failed to update question', details: error.message },
      { status: 500 }
    )
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
    const { id } = await params

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
      console.error('Database error deleting question:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete question', details: dbError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error deleting question:', error)
    return NextResponse.json(
      { error: 'Failed to delete question', details: error.message },
      { status: 500 }
    )
  }
}

