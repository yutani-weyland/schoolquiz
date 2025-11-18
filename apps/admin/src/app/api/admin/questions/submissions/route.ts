import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { dummySupportTickets } from '@/lib/dummy-billing-data'

// Dummy data for user question submissions
const dummySubmissions = [
  {
    id: 'sub-1',
    userId: 'user-1',
    userName: 'Sarah Johnson',
    userEmail: 'sarah@melbournehigh.edu.au',
    question: 'What year did the Australian Constitution come into effect?',
    answer: '1901',
    explanation: 'The Australian Constitution came into effect on 1 January 1901, when the six colonies federated to form the Commonwealth of Australia.',
    category: 'Australian History',
    status: 'PENDING',
    reviewedBy: null,
    reviewedAt: null,
    notes: null,
    teacherName: 'Mrs K',
    schoolName: 'Melbourne High School',
    consentForShoutout: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sub-2',
    userId: 'user-2',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    question: 'Which Australian state is known as the "Sunshine State"?',
    answer: 'Queensland',
    explanation: null,
    category: 'Geography',
    status: 'APPROVED',
    reviewedBy: 'admin-1',
    reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Good question, approved for use.',
    teacherName: 'Mr Smith',
    schoolName: 'Sydney Grammar School',
    consentForShoutout: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sub-3',
    userId: 'user-3',
    userName: 'Emma Wilson',
    userEmail: 'emma@sydneygrammar.edu.au',
    question: 'Who was the first female Prime Minister of Australia?',
    answer: 'Julia Gillard',
    explanation: 'Julia Gillard became the first female Prime Minister of Australia in 2010.',
    category: 'Australian Politics',
    status: 'REJECTED',
    reviewedBy: 'admin-1',
    reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Answer is incorrect - should be verified.',
    teacherName: 'Ms Wilson',
    schoolName: 'Sydney Grammar School',
    consentForShoutout: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

/**
 * GET /api/admin/questions/submissions
 * List user question submissions
 */
export async function GET(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || ''

    // For testing: Always use dummy data
    console.log('Using dummy data for question submissions')
    let filtered = [...dummySubmissions]

    if (status) {
      filtered = filtered.filter(sub => sub.status === status)
    }

    return NextResponse.json({ submissions: filtered })
  } catch (error: any) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions', details: error.message },
      { status: 500 }
    )
  }
}

