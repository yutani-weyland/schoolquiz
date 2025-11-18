import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { dummyFeatureFlags } from '@/lib/dummy-billing-data'

/**
 * GET /api/admin/system/feature-flags
 * List feature flags (admin only)
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
    console.log('Using dummy data for feature flags')

    return NextResponse.json({ flags: dummyFeatureFlags })
  } catch (error: any) {
    console.error('Error fetching feature flags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feature flags', details: error.message },
      { status: 500 }
    )
  }
}

