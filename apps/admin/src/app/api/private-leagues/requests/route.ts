import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireApiAuth } from '@/lib/api-auth'
import { ForbiddenError } from '@/lib/api-error'
import { auth } from '@schoolquiz/auth'

/**
 * GET /api/private-leagues/requests
 * Get pending requests for leagues the user administers
 */
export async function GET(request: NextRequest) {
  const totalStart = Date.now()
  try {
    // Optimized auth: Only fetch user ID for league lookup
    const authStart = Date.now()
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await (prisma as any).user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
      },
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }
    
    const authDuration = Date.now() - authStart
    console.log(`[Requests API] Auth took ${authDuration}ms`)

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

    // Get pending requests for these leagues - optimized: no nested includes
    let requests: any[] = []
    try {
      const queryStart = Date.now()
      
      // Check if privateLeagueRequest model exists
      if (!('privateLeagueRequest' in prisma) || typeof (prisma as any).privateLeagueRequest?.findMany !== 'function') {
        console.warn('[Requests API] privateLeagueRequest model not found in Prisma client')
        return NextResponse.json({ requests: [] })
      }
      
      // Fetch requests without includes to avoid slow joins
      const requestsData = await (prisma as any).privateLeagueRequest.findMany({
        where: {
          leagueId: { in: leagueIds },
          status: 'PENDING',
        },
        select: {
          id: true,
          leagueId: true,
          userId: true,
          status: true,
          requestedAt: true,
          respondedAt: true,
          respondedByUserId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          requestedAt: 'desc',
        },
      })
      
      const requestsQueryTime = Date.now() - queryStart
      
      if (requestsData.length === 0) {
        return NextResponse.json({ requests: [] })
      }
      
      // Extract unique IDs for batch fetching
      const userIds = new Set<string>(requestsData.map((r: any) => r.userId))
      const uniqueLeagueIds = new Set<string>(requestsData.map((r: any) => r.leagueId))
      
      // Batch fetch users and leagues in parallel
      const [users, leagues] = await Promise.all([
        (prisma as any).user.findMany({
          where: { id: { in: Array.from(userIds) } },
          select: {
            id: true,
            name: true,
            email: true,
            teamName: true,
          },
        }),
        (prisma as any).privateLeague.findMany({
          where: { id: { in: Array.from(uniqueLeagueIds) } },
          select: {
            id: true,
            name: true,
            organisationId: true,
          },
        }),
      ])
      
      // Get organisation IDs and fetch organisations
      const orgIds = new Set<string>(
        leagues
          .map((l: any) => l.organisationId)
          .filter((id: string | null): id is string => id !== null)
      )
      
      const organisations = orgIds.size > 0
        ? await (prisma as any).organisation.findMany({
            where: { id: { in: Array.from(orgIds) } },
            select: {
              id: true,
              name: true,
            },
          })
        : []
      
      // Create lookup maps
      const userMap = new Map(users.map((u: any) => [u.id, u]))
      const leagueMap = new Map(leagues.map((l: any) => [l.id, l]))
      const orgMap = new Map(organisations.map((o: any) => [o.id, o]))
      
      // Build response with mapped relations
      requests = requestsData.map((r: any) => {
        const league = leagueMap.get(r.leagueId) as any
        return {
          ...r,
          user: userMap.get(r.userId) || null,
          league: league
            ? {
                id: league.id,
                name: league.name,
                organisation: league.organisationId
                  ? orgMap.get(league.organisationId) || null
                  : null,
              }
            : null,
        }
      })
      
      const totalTime = Date.now() - queryStart
      console.log(`[Requests API] Fetched ${requests.length} requests in ${totalTime}ms (queries: ${requestsQueryTime}ms)`)
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

    const totalDuration = Date.now() - totalStart
    console.log(`[Requests API] Total request took ${totalDuration}ms`)
    
    return NextResponse.json({ requests })
  } catch (error: any) {
    console.error('[Requests API] Error fetching league requests:', error)
    console.error('[Requests API] Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    })
    
    // Check if it's a database/table error
    const errorMsg = error.message || String(error)
    if (errorMsg.includes('does not exist') || 
        errorMsg.includes('Unknown model') ||
        errorMsg.includes('private_league') ||
        errorMsg.includes('P1001') || // Prisma connection error
        errorMsg.includes('connect') ||
        errorMsg.includes('Cannot find') ||
        errorMsg.includes('is not a function')) {
      console.warn('[Requests API] Database/table error - returning empty array:', errorMsg)
      return NextResponse.json({ requests: [] })
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch requests', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
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
    const user = await requireApiAuth()

    const isPremium = user.tier === 'premium' || 
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
    
    if (!isPremium) {
      throw new ForbiddenError('Private leagues are only available to premium users')
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
    const userWithOrgs = await (prisma as any).user.findUnique({
      where: { id: user.id },
      include: {
        organisationMembers: {
          where: { status: 'ACTIVE' },
          select: { organisationId: true, status: true },
        },
      },
    })
    
    const userOrg = userWithOrgs?.organisationMembers?.find(
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

