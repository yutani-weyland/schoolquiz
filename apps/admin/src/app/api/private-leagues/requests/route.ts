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
 * GET /api/private-leagues/requests
 * Get pending requests for leagues the user administers
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

    // Get all leagues where user is creator
    let userLeagues: any[] = []
    try {
      userLeagues = await (prisma as any).privateLeague.findMany({
        where: {
          createdByUserId: user.id,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      })
    } catch (leagueError: any) {
      // If the table doesn't exist yet, return empty array
      const errorMsg = leagueError.message || String(leagueError)
      if (errorMsg.includes('does not exist') || 
          errorMsg.includes('Unknown model') ||
          errorMsg.includes('private_league')) {
        console.warn('Could not fetch leagues (table may not exist):', errorMsg)
        return NextResponse.json({ requests: [] })
      }
      // Re-throw other errors
      throw leagueError
    }

    const leagueIds = userLeagues.map((l: any) => l.id)

    if (leagueIds.length === 0) {
      return NextResponse.json({ requests: [] })
    }

    // Get pending requests for these leagues
    let requests: any[] = []
    try {
      requests = await (prisma as any).privateLeagueRequest.findMany({
        where: {
          leagueId: { in: leagueIds },
          status: 'PENDING',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              teamName: true,
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
          league: {
            select: {
              id: true,
              name: true,
              organisation: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          requestedAt: 'desc',
        },
      })
    } catch (requestError: any) {
      // If the table doesn't exist yet, return empty array
      const errorMsg = requestError.message || String(requestError)
      if (errorMsg.includes('does not exist') || 
          errorMsg.includes('Unknown model') ||
          errorMsg.includes('private_league_requests')) {
        console.warn('Could not fetch league requests (table may not exist):', errorMsg)
        return NextResponse.json({ requests: [] })
      }
      // Re-throw other errors
      throw requestError
    }

    return NextResponse.json({ requests })
  } catch (error: any) {
    console.error('Error fetching league requests:', error)
    
    // Check if it's a database/table error
    const errorMsg = error.message || String(error)
    if (errorMsg.includes('does not exist') || 
        errorMsg.includes('Unknown model') ||
        errorMsg.includes('private_league') ||
        errorMsg.includes('P1001') || // Prisma connection error
        errorMsg.includes('connect')) {
      console.warn('Database/table error in league requests:', errorMsg)
      return NextResponse.json({ requests: [] })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch requests', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/private-leagues/requests
 * Create a new join request
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { leagueId } = body

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      )
    }

    // Get the league
    const league = await (prisma as any).privateLeague.findFirst({
      where: { id: leagueId, deletedAt: null },
      include: {
        members: {
          where: { leftAt: null },
        },
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      )
    }

    // Check if league is organization-specific
    if (!league.organisationId) {
      return NextResponse.json(
        { error: 'This league does not accept join requests. Use the invite code instead.' },
        { status: 400 }
      )
    }

    // Check if user is in the same organization
    const userOrg = user.organisationMembers.find(
      (m: any) => m.organisationId === league.organisationId && m.status === 'ACTIVE'
    )

    if (!userOrg) {
      return NextResponse.json(
        { error: 'You must be a member of the same organization to request to join this league' },
        { status: 403 }
      )
    }

    // Check if user is already a member
    const isMember = league.members.some((m: any) => m.userId === user.id)
    if (isMember) {
      return NextResponse.json(
        { error: 'You are already a member of this league' },
        { status: 400 }
      )
    }

    // Check if there's already a pending request
    const existingRequest = await (prisma as any).privateLeagueRequest.findFirst({
      where: {
        leagueId,
        userId: user.id,
        status: 'PENDING',
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request for this league' },
        { status: 400 }
      )
    }

    // Create the request
    const newRequest = await (prisma as any).privateLeagueRequest.create({
      data: {
        leagueId,
        userId: user.id,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            teamName: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        league: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating league request:', error)
    return NextResponse.json(
      { error: 'Failed to create request', details: error.message },
      { status: 500 }
    )
  }
}

