import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { dummySupportTickets } from '@/lib/dummy-billing-data'

/**
 * GET /api/admin/support/tickets
 * List support tickets (admin only)
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

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''

    // For testing: Always use dummy data
    console.log('Using dummy data for support tickets')
    let filtered = [...dummySupportTickets]

    if (status) {
      filtered = filtered.filter(ticket => ticket.status === status)
    }

    if (priority) {
      filtered = filtered.filter(ticket => ticket.priority === priority)
    }

    return NextResponse.json({ tickets: filtered })
  } catch (error: any) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support tickets', details: error.message },
      { status: 500 }
    )
  }
}

