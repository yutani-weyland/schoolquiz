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
    // For now, return dummy data with usage stats
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
        // Usage tracking
        usedInDraftQuizzes: 0,
        usedInPublishedQuizzes: 0,
        usageCount: 0,
        lastUsedAt: null,
        // Performance stats
        successRate: undefined,
        totalAttempts: 0,
      },
      {
        id: 'q-2',
        text: 'Which battle marked the end of World War II in the Pacific?',
        answer: 'Battle of Okinawa',
        explanation: 'The Battle of Okinawa was the last major battle of World War II.',
        categoryId: 'cat-2',
        categoryName: 'WW2 History',
        difficulty: 0.7,
        isUsed: true,
        // Usage tracking - used in published quiz
        usedInDraftQuizzes: 0,
        usedInPublishedQuizzes: 2,
        usageCount: 2,
        lastUsedAt: '2024-11-15T00:00:00Z',
        // Performance stats
        successRate: 0.78,
        totalAttempts: 150,
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
        // Usage tracking - used in draft only
        usedInDraftQuizzes: 1,
        usedInPublishedQuizzes: 0,
        usageCount: 1,
        lastUsedAt: '2024-11-10T00:00:00Z',
        // Performance stats
        successRate: undefined,
        totalAttempts: 0,
      },
      {
        id: 'q-4',
        text: 'What is the largest state in Australia by area?',
        answer: 'Western Australia',
        explanation: 'Western Australia is the largest state, covering about one-third of the continent.',
        categoryId: 'cat-4',
        categoryName: 'Geography',
        difficulty: 0.5,
        isUsed: false,
        // Usage tracking
        usedInDraftQuizzes: 0,
        usedInPublishedQuizzes: 0,
        usageCount: 0,
        lastUsedAt: null,
        // Performance stats
        successRate: undefined,
        totalAttempts: 0,
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

