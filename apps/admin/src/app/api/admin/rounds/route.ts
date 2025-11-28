import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/api-validation'
import { CreateRoundSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api-error'

/**
 * POST /api/admin/rounds
 * Create a new standalone round
 */
export async function POST(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production

    // Validate request body with Zod
    const body = await validateRequest(request, CreateRoundSchema)
    const { title, categoryId, blurb, questions } = body

    // TODO: Save to database
    // For now, just return success
    const round = {
      id: `r-${Date.now()}`,
      title,
      categoryId,
      blurb: blurb || null,
      questions: questions.map((q: any, index: number) => ({
        id: `q-${Date.now()}-${index}`,
        text: q.text,
        answer: q.answer,
        explanation: q.explanation || null,
        categoryId,
      })),
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ round }, { status: 201 })
  } catch (error: any) {
    return handleApiError(error)
  }
}

