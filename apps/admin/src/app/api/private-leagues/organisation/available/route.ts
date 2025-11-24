import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  let userId: string | null = request.headers.get('X-User-Id')
  
  if (!userId && token.startsWith('mock-token-')) {
    const parts = token.split('-')
    if (parts.length >= 3) {
      userId = parts.slice(2, -1).join('-')
    }
  }

  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organisationMembers: {
        where: { status: 'ACTIVE' },
        include: { organisation: true },
      },
    },
  })

  return user
}

/**
 * GET /api/private-leagues/organisation/available
 * Get available leagues in user's organization that they can request to join
 * Query params: search, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.tier !== 'premium') {
      return NextResponse.json(
        { error: 'Private leagues are only available to premium users' },
        { status: 403 }
      )
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100) // Max 100 per page
    const skip = (page - 1) * limit

    // Get user's active organization memberships
    const userOrgs = user.organisationMembers.map((m: any) => m.organisationId)

    if (userOrgs.length === 0) {
      return NextResponse.json({ 
        leagues: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        },
      })
    }

    // Build where clause
    const whereClause: any = {
      organisationId: { in: userOrgs },
      deletedAt: null,
      createdByUserId: { not: user.id }, // Exclude leagues they created
      members: {
        none: {
          userId: user.id,
          leftAt: null,
        },
      },
    }

    // Add search filter
    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count for pagination
    const total = await (prisma as any).privateLeague.count({
      where: whereClause,
    })

    // Get leagues in user's organizations that they're not already a member of
    const availableLeagues = await (prisma as any).privateLeague.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            members: {
              where: {
                leftAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Check which ones have pending requests (only if there are leagues)
    let pendingRequests: any[] = []
    const leagueIds = availableLeagues.map((l: any) => l.id)
    
    if (leagueIds.length > 0) {
      try {
        pendingRequests = await (prisma as any).privateLeagueRequest.findMany({
          where: {
            leagueId: { in: leagueIds },
            userId: user.id,
            status: 'PENDING',
          },
          select: {
            leagueId: true,
          },
        })
      } catch (requestError: any) {
        // If the table doesn't exist yet, just continue without request status
        console.warn('Could not fetch pending requests (table may not exist):', requestError.message)
        pendingRequests = []
      }
    }

    const pendingLeagueIds = new Set(pendingRequests.map((r: any) => r.leagueId))

    // Assign colors to leagues if not present (for consistency)
    const defaultColors = [
      '#3B82F6', // Blue
      '#8B5CF6', // Purple
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#EC4899', // Pink
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#6366F1', // Indigo
      '#F97316', // Orange
      '#14B8A6', // Teal
      '#A855F7', // Violet
      '#22C55E', // Green
      '#EAB308', // Yellow
      '#F43F5E', // Rose
      '#0EA5E9', // Sky
    ]
    
    // Add request status and color to each league
    const leaguesWithStatus = availableLeagues.map((league: any) => {
      // Assign color based on league ID if not present
      let leagueColor = league.color
      if (!leagueColor) {
        const colorIndex = parseInt(league.id.slice(-2), 16) % defaultColors.length
        leagueColor = defaultColors[colorIndex]
      }
      
      return {
        ...league,
        color: leagueColor,
        hasPendingRequest: pendingLeagueIds.has(league.id),
      }
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({ 
      leagues: leaguesWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error: any) {
    console.error('Error fetching available organization leagues:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        error: 'Failed to fetch leagues', 
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    )
  }
}

