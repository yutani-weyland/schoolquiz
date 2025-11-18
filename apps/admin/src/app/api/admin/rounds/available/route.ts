import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/rounds/available
 * Get available (unused) rounds for import
 */
export async function GET(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production

    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId') || ''
    const search = searchParams.get('search') || ''

    // TODO: Fetch from database where rounds haven't been used in published quizzes
    // For now, return dummy data
    const dummyRounds = [
      {
        id: 'r-1',
        title: 'WW2 History',
        categoryId: 'cat-2',
        categoryName: 'WW2 History',
        blurb: 'Questions about World War II',
        questions: [
          {
            id: 'q-r1-1',
            text: 'Which battle marked the end of World War II in the Pacific?',
            answer: 'Battle of Okinawa',
            explanation: 'The Battle of Okinawa was the last major battle of World War II.',
            categoryId: 'cat-2',
          },
          {
            id: 'q-r1-2',
            text: 'In what year did World War II end?',
            answer: '1945',
            explanation: 'World War II ended in 1945.',
            categoryId: 'cat-2',
          },
        ],
        isUsed: false,
      },
      {
        id: 'r-2',
        title: 'Australian Geography',
        categoryId: 'cat-4',
        categoryName: 'Geography',
        blurb: 'Questions about Australian geography',
        questions: [
          {
            id: 'q-r2-1',
            text: 'What is the capital of Western Australia?',
            answer: 'Perth',
            explanation: 'Perth is the capital and largest city of Western Australia.',
            categoryId: 'cat-4',
          },
          {
            id: 'q-r2-2',
            text: 'Which Australian state is known as the "Sunshine State"?',
            answer: 'Queensland',
            explanation: 'Queensland is known as the Sunshine State.',
            categoryId: 'cat-4',
          },
        ],
        isUsed: false,
      },
    ]

    let filtered = dummyRounds

    if (categoryId) {
      filtered = filtered.filter(r => r.categoryId === categoryId)
    }

    if (search) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.blurb?.toLowerCase().includes(search.toLowerCase())
      )
    }

    return NextResponse.json({ rounds: filtered })
  } catch (error: any) {
    console.error('Error fetching available rounds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available rounds', details: error.message },
      { status: 500 }
    )
  }
}

