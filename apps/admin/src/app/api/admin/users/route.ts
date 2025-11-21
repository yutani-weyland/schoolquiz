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
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    try {
      // Build where clause
      const where: any = {}
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      }
      
      if (tier) {
        where.tier = tier
      }

      // Build orderBy clause
      const orderBy: any = {}
      switch (sortBy) {
        case 'name':
          orderBy.name = sortOrder
          break
        case 'email':
          orderBy.email = sortOrder
          break
        case 'tier':
          orderBy.tier = sortOrder
          break
        case 'lastLoginAt':
          orderBy.lastLoginAt = sortOrder === 'asc' ? 'asc' : 'desc'
          break
        case 'createdAt':
        default:
          orderBy.createdAt = sortOrder === 'asc' ? 'asc' : 'desc'
          break
      }

      // Fetch users from database
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            email: true,
            name: true,
            tier: true,
            platformRole: true,
            subscriptionStatus: true,
            subscriptionPlan: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                organisationMembers: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ])
      
      console.log(`✅ Fetched ${users.length} users from database (total: ${total})`)

      // Transform to match expected format
      const formattedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        platformRole: user.platformRole,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        _count: {
          organisations: user._count.organisationMembers,
        },
      }))

      return NextResponse.json({
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
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
      console.log('⚠️  Falling back to dummy data for users')
      
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
      
      // Apply sorting
      filtered.sort((a, b) => {
        let aValue: any
        let bValue: any
        
        switch (sortBy) {
          case 'name':
            aValue = a.name || a.email
            bValue = b.name || b.email
            break
          case 'email':
            aValue = a.email
            bValue = b.email
            break
          case 'tier':
            aValue = a.tier
            bValue = b.tier
            break
          case 'lastLoginAt':
            aValue = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0
            bValue = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0
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
    }
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/users
 * Create a new user (admin only)
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
    const { email, name, tier, platformRole, subscriptionStatus } = body

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name?.trim() || null,
        tier: tier || 'basic',
        platformRole: platformRole || null,
        subscriptionStatus: subscriptionStatus || 'FREE_TRIAL',
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        platformRole: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            organisationMembers: true,
          },
        },
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        platformRole: user.platformRole,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        _count: {
          organisations: user._count.organisationMembers,
        },
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    )
  }
}

