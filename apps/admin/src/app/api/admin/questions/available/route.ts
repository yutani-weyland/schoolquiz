import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/admin/questions/available
 * Get available (unused) questions for import
 */
export async function GET(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production

    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId') || ''
    const search = searchParams.get('search') || ''

    // TODO: Fetch from database where isUsed = false
    // For now, return dummy data
    const dummyQuestions = [
      {
        id: 'q-1',
        text: 'What is the capital of Western Australia?',
        answer: 'Perth',
        explanation: 'Perth is the capital and largest city of Western Australia.',
        categoryId: 'cat-4',
        categoryName: 'Geography',
        difficulty: 0.4,
        isUsed: false,
      },
      {
        id: 'q-2',
        text: 'Which battle marked the end of World War II in the Pacific?',
        answer: 'Battle of Okinawa',
        explanation: 'The Battle of Okinawa was the last major battle of World War II.',
        categoryId: 'cat-2',
        categoryName: 'WW2 History',
        difficulty: 0.7,
        isUsed: false,
      },
      {
        id: 'q-3',
        text: 'What does NAIDOC stand for?',
        answer: 'National Aborigines and Islanders Day Observance Committee',
        explanation: 'NAIDOC Week celebrates the history, culture and achievements of Aboriginal and Torres Strait Islander peoples.',
        categoryId: 'cat-6',
        categoryName: 'NAIDOC Week',
        difficulty: 0.6,
        isUsed: false,
      },
    ]

    let filtered = dummyQuestions

    if (categoryId) {
      filtered = filtered.filter(q => q.categoryId === categoryId)
    }

    if (search) {
      filtered = filtered.filter(q => 
        q.text.toLowerCase().includes(search.toLowerCase()) ||
        q.answer.toLowerCase().includes(search.toLowerCase())
      )
    }

    return NextResponse.json({ questions: filtered })
  } catch (error: any) {
    console.error('Error fetching available questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available questions', details: error.message },
      { status: 500 }
    )
  }
}

