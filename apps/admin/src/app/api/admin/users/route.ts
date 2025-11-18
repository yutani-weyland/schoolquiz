import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { dummyUsers } from '@/lib/dummy-data'

/**
 * GET /api/admin/users
 * List all users (admin only)
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
    const search = searchParams.get('search') || ''
    const tier = searchParams.get('tier') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // For testing: Always use dummy data
    // TODO: Switch to database when ready
    console.log('Using dummy data for users')
    let filtered = [...dummyUsers]
    
    if (search) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (tier) {
      filtered = filtered.filter(user => user.tier === tier)
    }
    
    const total = filtered.length
    const users = filtered.slice(skip, skip + limit)

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    )
  }
}

