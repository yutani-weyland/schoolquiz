import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { dummyOrganisations } from '@/lib/dummy-data'
import { unstable_cache } from 'next/cache'
import { CACHE_TTL, CACHE_TAGS, createCacheKey } from '@/lib/cache-config'

/**
 * Internal function to fetch organisations from database
 */
async function getOrganisationsInternal(params: {
  search: string
  status: string
  page: number
  limit: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}) {
  const { search, status, page, limit, sortBy, sortOrder } = params
  const skip = (page - 1) * limit

  try {
    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { emailDomain: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (status) {
      where.status = status
    }

    // Build orderBy clause
    const orderBy: any = {}
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder
        break
      case 'status':
        orderBy.status = sortOrder
        break
      case 'plan':
        orderBy.plan = sortOrder
        break
      case 'members':
        // For member count, we'll need to sort after fetching
        orderBy.createdAt = sortOrder === 'asc' ? 'asc' : 'desc'
        break
      case 'createdAt':
      default:
        orderBy.createdAt = sortOrder === 'asc' ? 'asc' : 'desc'
        break
    }

    // Fetch organisations from database
    // Use select instead of include for better performance
    let [organisations, total] = await Promise.all([
      prisma.organisation.findMany({
        where,
        skip: sortBy === 'members' ? 0 : skip, // Fetch all if sorting by members
        take: sortBy === 'members' ? undefined : limit,
        orderBy,
        select: {
          id: true,
          name: true,
          emailDomain: true,
          ownerUserId: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          maxSeats: true,
          plan: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          gracePeriodEnd: true,
          featureFlags: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              members: true,
              groups: true,
            },
          },
        },
      }),
      prisma.organisation.count({ where }),
    ])

    // If sorting by members, sort and paginate manually
    if (sortBy === 'members') {
      organisations.sort((a, b) => {
        const aCount = a._count.members
        const bCount = b._count.members
        return sortOrder === 'asc' ? aCount - bCount : bCount - aCount
      })
      organisations = organisations.slice(skip, skip + limit)
    }

    // Transform to match expected format
    const formattedOrganisations = organisations.map(org => ({
      id: org.id,
      name: org.name,
      emailDomain: org.emailDomain,
      status: org.status,
      plan: org.plan,
      maxSeats: org.maxSeats,
      currentPeriodEnd: org.currentPeriodEnd?.toISOString() || null,
      owner: org.owner ? {
        id: org.owner.id,
        name: org.owner.name,
        email: org.owner.email,
      } : null,
      _count: {
        members: org._count.members,
        groups: org._count.groups,
      },
      createdAt: org.createdAt.toISOString(),
    }))

    return {
      organisations: formattedOrganisations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (dbError: any) {
    // Log the actual database error for debugging
    console.error('❌ Database query failed:', dbError)
    console.error('Error message:', dbError.message)
    console.error('Error code:', dbError.code)
    console.error('Error name:', dbError.name)
    
    // Check if it's a connection error
    if (dbError.code === 'P1001' || dbError.message?.includes('Can\'t reach database server')) {
      console.error('⚠️  Database connection failed. Please check:')
      console.error('   1. DATABASE_URL is set in .env.local')
      console.error('   2. Database server is running')
      console.error('   3. Connection string is correct')
      console.error('   4. Run: cd packages/db && pnpm db:generate && pnpm db:migrate')
    }
    
    // Fallback to dummy data if database is not available
    console.log('⚠️  Falling back to dummy data for organisations')
    
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

    return {
      organisations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}

/**
 * GET /api/admin/organisations
 * List all organisations (admin only)
 * Cached for non-search queries to improve performance
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50', 10)))
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const params = { search, status, page, limit, sortBy, sortOrder }

    // Only cache non-search, non-filter queries (search results should be fresh)
    if (!search && !status) {
      const result = await unstable_cache(
        () => getOrganisationsInternal(params),
        createCacheKey('organisations', {
          page: page.toString(),
          limit: limit.toString(),
          sortBy,
          sortOrder,
        }),
        {
          revalidate: CACHE_TTL.LIST,
          tags: [CACHE_TAGS.ORGANISATIONS],
        }
      )()
      
      return NextResponse.json(result)
    }

    // No cache for search/filter queries (always fresh)
    const result = await getOrganisationsInternal(params)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching organisations:', error)
    console.error('Error stack:', error.stack)
    
    // Ensure we always return JSON, never HTML
    try {
      return NextResponse.json(
        { 
          error: 'Failed to fetch organisations', 
          details: error?.message || 'Unknown error',
          type: error?.name || 'Error'
        },
        { status: 500 }
      )
    } catch (jsonError) {
      // If even JSON serialization fails, return a simple error
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

/**
 * POST /api/admin/organisations
 * Create a new organisation (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Add proper admin role check

    const body = await request.json()
    const { name, emailDomain, ownerUserId, maxSeats, plan, status } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Organisation name is required' },
        { status: 400 }
      )
    }

    if (!ownerUserId) {
      return NextResponse.json(
        { error: 'Owner user ID is required' },
        { status: 400 }
      )
    }

    // Verify owner user exists
    const owner = await prisma.user.findUnique({
      where: { id: ownerUserId },
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner user not found' },
        { status: 404 }
      )
    }

    // Create organisation
    const organisation = await prisma.organisation.create({
      data: {
        name: name.trim(),
        emailDomain: emailDomain?.trim() || null,
        ownerUserId,
        maxSeats: maxSeats || 0,
        plan: plan || 'INDIVIDUAL',
        status: status || 'TRIALING',
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            groups: true,
          },
        },
      },
    })

    // Create owner as a member with OWNER role
    await prisma.organisationMember.create({
      data: {
        organisationId: organisation.id,
        userId: ownerUserId,
        role: 'OWNER',
        status: 'ACTIVE',
        seatAssignedAt: new Date(),
      },
    })

    return NextResponse.json({
      organisation: {
        id: organisation.id,
        name: organisation.name,
        emailDomain: organisation.emailDomain,
        status: organisation.status,
        plan: organisation.plan,
        maxSeats: organisation.maxSeats,
        currentPeriodEnd: organisation.currentPeriodEnd?.toISOString() || null,
        owner: organisation.owner ? {
          id: organisation.owner.id,
          name: organisation.owner.name,
          email: organisation.owner.email,
        } : null,
        _count: {
          members: organisation._count.members + 1, // +1 for the owner we just added
          groups: organisation._count.groups,
        },
        createdAt: organisation.createdAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating organisation:', error)
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An organisation with this name or email domain already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create organisation', details: error.message },
      { status: 500 }
    )
  }
}
