import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { dummyLearningData } from '@/lib/dummy-analytics-data'

/**
 * GET /api/admin/analytics/learning
 * Get learning analytics (admin only)
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
    console.log('Using dummy data for learning analytics')

    return NextResponse.json(dummyLearningData)
  } catch (error: any) {
    console.error('Error fetching learning analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch learning analytics', details: error.message },
      { status: 500 }
    )
  }
}

