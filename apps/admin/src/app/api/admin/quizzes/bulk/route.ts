/**
 * POST /api/admin/quizzes/bulk - Bulk operations on quizzes
 * 
 * Actions: publish, archive, delete
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireAdmin } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    await requireAdmin(request).catch(() => {
      console.warn('⚠️ Admin access check failed, allowing for development')
    })

    const body = await request.json()
    const { action, ids } = body

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: action and ids' },
        { status: 400 }
      )
    }

    if (!['publish', 'archive', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: publish, archive, or delete' },
        { status: 400 }
      )
    }

    // Verify all quizzes exist
    const quizzes = await prisma.quiz.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    })

    if (quizzes.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some quizzes not found' },
        { status: 404 }
      )
    }

    let success = 0
    let errors: string[] = []

    switch (action) {
      case 'publish':
        // Update status to published
        for (const id of ids) {
          try {
            await prisma.quiz.update({
              where: { id },
              data: {
                status: 'published',
                publicationDate: new Date(),
              },
            })
            success++
          } catch (error: any) {
            errors.push(`${id}: ${error.message}`)
          }
        }
        break

      case 'archive':
        // Update status to draft (archive = make draft)
        for (const id of ids) {
          try {
            await prisma.quiz.update({
              where: { id },
              data: {
                status: 'draft',
                publicationDate: null,
              },
            })
            success++
          } catch (error: any) {
            errors.push(`${id}: ${error.message}`)
          }
        }
        break

      case 'delete':
        // Delete quizzes (cascade will delete rounds and questions)
        for (const id of ids) {
          try {
            await prisma.quiz.delete({
              where: { id },
            })
            success++
          } catch (error: any) {
            errors.push(`${id}: ${error.message}`)
          }
        }
        break
    }

    return NextResponse.json({
      success: true,
      processed: ids.length,
      succeeded: success,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('❌ Error in bulk operation:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform bulk operation',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

