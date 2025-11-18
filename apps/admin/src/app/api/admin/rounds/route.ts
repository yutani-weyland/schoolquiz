import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/rounds
 * Create a new standalone round
 */
export async function POST(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production

    const body = await request.json()
    const { title, categoryId, blurb, questions } = body

    if (!title || !categoryId || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, categoryId, questions' },
        { status: 400 }
      )
    }

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
    console.error('Error creating round:', error)
    return NextResponse.json(
      { error: 'Failed to create round', details: error.message },
      { status: 500 }
    )
  }
}

