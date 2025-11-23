import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/admin/billing/webhooks
 * List Stripe webhook events (admin only)
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

    // For testing: Return empty array as dummy data is removed
    console.log('Using empty data for webhook events')

    return NextResponse.json({ events: [] })
  } catch (error: any) {
    console.error('Error fetching webhook events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook events', details: error.message },
      { status: 500 }
    )
  }
}
