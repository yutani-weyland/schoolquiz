import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { dummyBillingData } from '@/lib/dummy-billing-data'

/**
 * GET /api/admin/billing/subscriptions/[id]
 * Get subscription details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Skip auth for testing
    const { id } = await params

    const subscription = dummyBillingData.subscriptions.find(s => s.id === id)
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ subscription })
  } catch (error: any) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/billing/subscriptions/[id]
 * Update subscription (e.g., modify cost, plan, etc.)
 */
export async function PUT(
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
    const { amount, plan, maxSeats, status } = body

    // TODO: Update subscription in database
    // This would update Stripe subscription and local database

    console.log('Updating subscription:', id, { amount, plan, maxSeats, status })

    return NextResponse.json({
      success: true,
      subscription: {
        id,
        amount,
        plan,
        maxSeats,
        status,
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription', details: error.message },
      { status: 500 }
    )
  }
}

