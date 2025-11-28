import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { validateRequest, validateQuery } from '@/lib/api-validation'
import { AdminCreateOrganisationSchema, AdminOrganisationsQuerySchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api-error'

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

    throw dbError
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

    // Validate query parameters
    const query = await validateQuery(request, AdminOrganisationsQuerySchema)
    const search = query.search || ''
    const status = query.status || ''
    const page = query.page || 1
    const limit = query.limit || 50
    const sortBy = query.sortBy || 'createdAt'
    const sortOrder = query.sortOrder || 'desc'

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
    return handleApiError(error)
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

    // Validate request body with Zod
    const body = await validateRequest(request, AdminCreateOrganisationSchema)
    const { name, emailDomain, ownerUserId, maxSeats, plan, status } = body

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
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An organisation with this name or email domain already exists' },
        { status: 409 }
      )
    }

    // Use centralized error handling (handles ValidationError automatically)
    return handleApiError(error)
  }
}
