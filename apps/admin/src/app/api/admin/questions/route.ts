import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/questions
 * Create a new standalone question
 */
export async function POST(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production

    const body = await request.json()
    const { text, answer, explanation, categoryId, createdBy } = body

    if (!text || !answer || !categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields: text, answer, categoryId' },
        { status: 400 }
      )
    }

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
    console.error('Error creating question:', error)
    return NextResponse.json(
      { error: 'Failed to create question', details: error.message },
      { status: 500 }
    )
  }
}

