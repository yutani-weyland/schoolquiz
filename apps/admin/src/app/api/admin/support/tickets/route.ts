import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'

/**
 * GET /api/admin/support/tickets
 * List support tickets (admin only)
 * 
 * TODO: Create SupportTicket model in database schema
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
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // TODO: Replace with database query when SupportTicket model is created
    // For now, return empty list
    console.log('Using empty data for support tickets (database model not yet created)')

    return NextResponse.json({
      tickets: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      }
    })
  } catch (error: any) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support tickets', details: error.message },
      { status: 500 }
    )
  }
}
