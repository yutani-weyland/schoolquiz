import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

/**
 * POST /api/admin/questions/submissions/[id]/approve
 * Approve a user submission and create a Question from it
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = await params
    const body = await request.json()
    const { categoryId } = body

    // TODO: Implement actual approval logic
    // 1. Fetch submission
    // 2. Create Question from submission
    // 3. Update submission status to APPROVED
    // 4. Link question to submission

    console.log('Approving submission:', id, 'with category:', categoryId)

    return NextResponse.json({
      success: true,
      question: {
        id: `question-${Date.now()}`,
        text: 'Approved question',
        answer: 'Answer',
      },
    })
  } catch (error: any) {
    console.error('Error approving submission:', error)
    return NextResponse.json(
      { error: 'Failed to approve submission', details: error.message },
      { status: 500 }
    )
  }
}

