import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireApiAuth } from '@/lib/api-auth'
import { ForbiddenError } from '@/lib/api-error'

/**
 * GET /api/private-leagues/[id]/teams
 * Get league teams with pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiAuth()
    const { id } = await params
    const { searchParams } = new URL(request.url)

    const isPremium = user.tier === 'premium' ||
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())

    if (!isPremium) {
      throw new ForbiddenError('Private leagues are only available to premium users')
    }

    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Check access
    const [league, membership] = await Promise.all([
      (prisma as any).privateLeague.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          createdByUserId: true,
        },
      }),
      (prisma as any).privateLeagueMember.findFirst({
        where: {
          leagueId: id,
          userId: user.id,
          leftAt: null,
        },
        select: {
          id: true,
        },
      }),
    ])

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    const isMember = !!membership
    if (!isMember && league.createdByUserId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch teams
    const teams = await (prisma as any).privateLeagueTeam.findMany({
      where: {
        leagueId: id,
        leftAt: null,
      },
      select: {
        id: true,
        teamId: true,
        joinedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            color: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        joinedAt: 'asc',
      },
    })

    const total = await (prisma as any).privateLeagueTeam.count({
      where: {
        leagueId: id,
        leftAt: null,
      },
    })

    return NextResponse.json({
      teams,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error: any) {
    console.error('Error fetching league teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams', details: error.message },
      { status: 500 }
    )
  }
}
