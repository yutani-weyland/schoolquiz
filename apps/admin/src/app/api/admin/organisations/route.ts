import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { dummyOrganisations } from '@/lib/dummy-data'

/**
 * GET /api/admin/organisations
 * List all organisations (admin only)
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
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // For testing: Always use dummy data
    // TODO: Switch to database when ready
    console.log('Using dummy data for organisations')
    let filtered = [...dummyOrganisations]
    
    if (search) {
      filtered = filtered.filter(org => 
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.emailDomain?.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (status) {
      filtered = filtered.filter(org => org.status === status)
    }
    
    const total = filtered.length
    const organisations = filtered.slice(skip, skip + limit)

    return NextResponse.json({
      organisations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching organisations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organisations', details: error.message },
      { status: 500 }
    )
  }
}

