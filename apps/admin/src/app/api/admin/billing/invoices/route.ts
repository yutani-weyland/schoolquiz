import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { dummyBillingData } from '@/lib/dummy-billing-data'

/**
 * GET /api/admin/billing/invoices
 * List all invoices (admin only)
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
    console.log('Using dummy data for invoices')

    return NextResponse.json({ invoices: dummyBillingData.invoices })
  } catch (error: any) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error.message },
      { status: 500 }
    )
  }
}

