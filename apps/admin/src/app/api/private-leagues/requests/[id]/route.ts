import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireApiAuth } from '@/lib/api-auth'

/**
 * PATCH /api/private-leagues/requests/[id]
 * Approve or reject a join request
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiAuth()
    const { id } = await params

    const body = await request.json()
    const { action } = body // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get the request
    const leagueRequest = await (prisma as any).privateLeagueRequest.findUnique({
      where: { id },
      include: {
        league: {
          include: {
            members: {
              where: { leftAt: null },
            },
          },
        },
      },
    })

    if (!leagueRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Check if user is the league creator
    if (leagueRequest.league.createdByUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only the league administrator can respond to requests' },
        { status: 403 }
      )
    }

    // Check if request is still pending
    if (leagueRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This request has already been processed' },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

    // Update the request
    await (prisma as any).privateLeagueRequest.update({
      where: { id },
      data: {
        status: newStatus,
        respondedAt: new Date(),
        respondedByUserId: user.id,
      },
    })

    // If approved, add user to league
    if (action === 'approve') {
      // Check if league is full
      if (leagueRequest.league.members.length >= leagueRequest.league.maxMembers) {
        return NextResponse.json(
          { error: 'League is full' },
          { status: 400 }
        )
      }

      // Add user as member
      await (prisma as any).privateLeagueMember.create({
        data: {
          leagueId: leagueRequest.leagueId,
          userId: leagueRequest.userId,
          invitedByUserId: user.id,
        },
      })

      // Initialize stats
      await (prisma as any).privateLeagueStats.upsert({
        where: {
          leagueId_userId_quizSlug: {
            leagueId: leagueRequest.leagueId,
            userId: leagueRequest.userId,
            quizSlug: null,
          },
        },
        create: {
          leagueId: leagueRequest.leagueId,
          userId: leagueRequest.userId,
          quizSlug: null,
        },
        update: {},
      })
    }

    return NextResponse.json({ success: true, action })
  } catch (error: any) {
    console.error('Error responding to league request:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    )
  }
}

