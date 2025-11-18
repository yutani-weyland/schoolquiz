import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { getDummyUserDetail } from '@/lib/dummy-data'

/**
 * GET /api/admin/users/[id]
 * Get user details (admin only)
 */
export async function GET(
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

    // TODO: Add proper admin role check

    const { id } = await params

    // For testing: Always use dummy data
    // TODO: Switch to database when ready
    console.log('Using dummy data for user detail')
    const targetUser = getDummyUserDetail(id)
    
    // If not found, return 404
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: targetUser })
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error.message },
      { status: 500 }
    )
  }
}

