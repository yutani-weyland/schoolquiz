import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

/**
 * POST /api/admin/questions/submissions/[id]/reject
 * Reject a user submission
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
    const { notes } = body

    // TODO: Implement actual rejection logic
    // 1. Fetch submission
    // 2. Update status to REJECTED
    // 3. Add notes

    console.log('Rejecting submission:', id, 'with notes:', notes)

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('Error rejecting submission:', error)
    return NextResponse.json(
      { error: 'Failed to reject submission', details: error.message },
      { status: 500 }
    )
  }
}

