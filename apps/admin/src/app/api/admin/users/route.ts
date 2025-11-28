import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { validateRequest, validateQuery } from '@/lib/api-validation'
import { AdminCreateUserSchema, AdminUsersQuerySchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api-error'

import { unstable_cache } from 'next/cache'
import { CACHE_TTL, CACHE_TAGS, createCacheKey } from '@/lib/cache-config'

/**
 * Internal function to fetch users from database
 */
async function getUsersInternal(params: {
  search: string
  tier: string
  page: number
  limit: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}) {
  const { search, tier, page, limit, sortBy, sortOrder } = params
  const skip = (page - 1) * limit

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

    return {
      users: formattedUsers,
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

    throw dbError
  }
}

/**
 * GET /api/admin/users
 * List all users (admin only)
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

    // Validate query parameters
    const query = await validateQuery(request, AdminUsersQuerySchema)
    const search = query.search || ''
    const tier = query.tier || ''
    const page = query.page || 1
    const limit = query.limit || 50
    const sortBy = query.sortBy || 'createdAt'
    const sortOrder = query.sortOrder || 'desc'

    const params = { search, tier, page, limit, sortBy, sortOrder }

    // Only cache non-search, non-filter queries (search results should be fresh)
    if (!search && !tier) {
      const result = await unstable_cache(
        () => getUsersInternal(params),
        createCacheKey('users', {
          page: page.toString(),
          limit: limit.toString(),
          sortBy,
          sortOrder,
        }),
        {
          revalidate: CACHE_TTL.LIST,
          tags: [CACHE_TAGS.USERS],
        }
      )()

      return NextResponse.json(result)
    }

    // No cache for search/filter queries (always fresh)
    const result = await getUsersInternal(params)
    return NextResponse.json(result)
  } catch (error: any) {
    return handleApiError(error)
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

    // Validate request body with Zod
    const body = await validateRequest(request, AdminCreateUserSchema)
    const { email, name, tier, platformRole, subscriptionStatus } = body

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
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // Use centralized error handling (handles ValidationError automatically)
    return handleApiError(error)
  }
}

