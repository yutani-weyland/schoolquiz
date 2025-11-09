import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAuth } from '@/lib/auth';
import { getOrganisationContext } from '@schoolquiz/db';
import { LeaderboardVisibility } from '@prisma/client';

/**
 * GET /api/my-leaderboards
 * Get all leaderboards visible to the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Get user's organisation memberships
    const memberships = await prisma.organisationMember.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        organisation: true,
        groupMembers: {
          include: {
            group: true,
          },
        },
      },
    });

    const organisationIds = memberships.map(m => m.organisationId);
    const groupIds = memberships.flatMap(m => 
      m.groupMembers.map(gm => gm.group.id)
    );

    // Get organisation-wide leaderboards
    const orgWideLeaderboards = await prisma.leaderboard.findMany({
      where: {
        organisationId: { in: organisationIds },
        visibility: LeaderboardVisibility.ORG_WIDE,
        deletedAt: null,
      },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          where: {
            userId: user.id,
            leftAt: null,
          },
        },
      },
    });

    // Get group leaderboards
    const groupLeaderboards = await prisma.leaderboard.findMany({
      where: {
        organisationGroupId: { in: groupIds },
        visibility: LeaderboardVisibility.GROUP,
        deletedAt: null,
      },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
        organisationGroup: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        members: {
          where: {
            userId: user.id,
            leftAt: null,
          },
        },
      },
    });

    // Get ad-hoc leaderboards (user is a member)
    const adHocLeaderboards = await prisma.leaderboard.findMany({
      where: {
        visibility: LeaderboardVisibility.AD_HOC,
        deletedAt: null,
        members: {
          some: {
            userId: user.id,
            leftAt: null,
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          where: {
            leftAt: null,
          },
          include: {
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
    });

    return NextResponse.json({
      orgWide: orgWideLeaderboards,
      group: groupLeaderboards,
      adHoc: adHocLeaderboards,
    });
  } catch (error: any) {
    console.error('Error fetching leaderboards:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaderboards' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

