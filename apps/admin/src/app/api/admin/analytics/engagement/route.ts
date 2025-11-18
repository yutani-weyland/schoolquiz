import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { dummyEngagementData } from '@/lib/dummy-analytics-data'

/**
 * GET /api/admin/analytics/engagement
 * Get engagement analytics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Add proper admin role check

    // For testing: Always use dummy data
    // TODO: Switch to database when ready
    console.log('Using dummy data for engagement analytics')

    return NextResponse.json(dummyEngagementData)
  } catch (error: any) {
    console.error('Error fetching engagement analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engagement analytics', details: error.message },
      { status: 500 }
    )
  }
}

