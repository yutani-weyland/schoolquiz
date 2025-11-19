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
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

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
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'plan':
          aValue = a.plan
          bValue = b.plan
          break
        case 'members':
          aValue = a._count.members
          bValue = b._count.members
          break
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
      }
      
      if (aValue === bValue) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1
      
      const comparison = typeof aValue === 'string' 
        ? aValue.localeCompare(bValue)
        : aValue - bValue
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
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

