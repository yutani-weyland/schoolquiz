import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireApiAuth } from '@/lib/api-auth'
import { ForbiddenError } from '@/lib/api-error'

/**
 * DELETE /api/private-leagues/[id]/teams/[teamId]
 * Remove a team from a league
 * Only league creator can remove teams
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  try {
    const user = await requireApiAuth()
    const { id: leagueId, teamId } = await params

    const isPremium = user.tier === 'premium' ||
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())

    if (!isPremium) {
      throw new ForbiddenError('Private leagues are only available to premium users')
    }

    // Check league exists and user is creator
    const league = await (prisma as any).privateLeague.findFirst({
      where: {
        id: leagueId,
        deletedAt: null,
      },
      select: {
        id: true,
        createdByUserId: true,
      },
    })

    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      )
    }

    if (league.createdByUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only the league creator can remove teams' },
        { status: 403 }
      )
    }

    // Check team exists in league
    const leagueTeam = await (prisma as any).privateLeagueTeam.findFirst({
      where: {
        leagueId,
        teamId,
        leftAt: null,
      },
      select: {
        id: true,
        team: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    })

    if (!leagueTeam) {
      return NextResponse.json(
        { error: 'Team not found in this league' },
        { status: 404 }
      )
    }

    // Soft delete by setting leftAt
    await (prisma as any).privateLeagueTeam.update({
      where: { id: leagueTeam.id },
      data: {
        leftAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Team removed from league',
    })
  } catch (error: any) {
    console.error('Error removing team from league:', error)
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to remove team', details: error.message },
      { status: 500 }
    )
  }
}
