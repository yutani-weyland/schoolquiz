import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/api-validation'
import { CreateQuestionSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api-error'

/**
 * POST /api/admin/questions
 * Create a new standalone question
 */
export async function POST(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production

    // Validate request body with Zod
    const body = await validateRequest(request, CreateQuestionSchema)
    const { text, answer, explanation, categoryId, createdBy } = body

    // TODO: Save to database
    // For now, just return success
    const question = {
      id: `q-${Date.now()}`,
      text,
      answer,
      explanation: explanation || null,
      categoryId,
      createdBy: createdBy || 'user-1',
      isUsed: false,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ question }, { status: 201 })
  } catch (error: any) {
    return handleApiError(error)
  }
}

