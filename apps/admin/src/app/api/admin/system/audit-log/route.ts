import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { dummyAuditLogs } from '@/lib/dummy-billing-data'

/**
 * GET /api/admin/system/audit-log
 * List audit log entries (admin only)
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
    const action = searchParams.get('action') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // For testing: Always use dummy data
    console.log('Using dummy data for audit logs')
    let filtered = [...dummyAuditLogs]

    if (action) {
      filtered = filtered.filter(log => log.action === action)
    }

    const total = filtered.length
    const logs = filtered.slice(skip, skip + limit)

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', details: error.message },
      { status: 500 }
    )
  }
}

