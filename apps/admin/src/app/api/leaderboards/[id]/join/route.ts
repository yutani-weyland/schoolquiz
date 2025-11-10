import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAuth } from '@/lib/auth';
import { getOrganisationContext, canWrite } from '@schoolquiz/db';
import { LeaderboardVisibility } from '@prisma/client';

/**
 * POST /api/leaderboards/:id/join
 * Join a leaderboard
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: leaderboardId } = await params;

    const leaderboard = await prisma.leaderboard.findUnique({
      where: { id: leaderboardId },
      include: {
        organisation: true,
      },
    });

    if (!leaderboard || leaderboard.deletedAt) {
      return NextResponse.json(
        { error: 'Leaderboard not found' },
        { status: 404 }
      );
    }

    // Check permissions based on visibility
    if (leaderboard.visibility === LeaderboardVisibility.ORG_WIDE) {
      if (leaderboard.organisationId) {
        const context = await getOrganisationContext(leaderboard.organisationId, user.id);
        if (!context || !canWrite(context)) {
          return NextResponse.json(
            { error: 'Must be an active organisation member' },
            { status: 403 }
          );
        }
      }
    } else if (leaderboard.visibility === LeaderboardVisibility.GROUP) {
      if (leaderboard.organisationGroupId) {
        // Check if user is in the group
        const groupMember = await prisma.organisationGroupMember.findFirst({
          where: {
            organisationGroupId: leaderboard.organisationGroupId,
            member: {
              userId: user.id,
              status: 'ACTIVE',
              deletedAt: null,
            },
          },
        });

        if (!groupMember) {
          return NextResponse.json(
            { error: 'Must be a member of the group' },
            { status: 403 }
          );
        }
      }
    } else if (leaderboard.visibility === LeaderboardVisibility.AD_HOC) {
      // Ad-hoc boards: creator can invite, but for now allow any authenticated user
      // In future, add invite system
    }

    // Check if already a member
    const existing = await prisma.leaderboardMember.findUnique({
      where: {
        leaderboardId_userId: {
          leaderboardId,
          userId: user.id,
        },
      },
    });

    if (existing && !existing.leftAt) {
      return NextResponse.json(
        { error: 'Already a member' },
        { status: 400 }
      );
    }

    // Get organisation member if applicable
    let organisationMemberId = null;
    if (leaderboard.organisationId) {
      const orgMember = await prisma.organisationMember.findUnique({
        where: {
          organisationId_userId: {
            organisationId: leaderboard.organisationId,
            userId: user.id,
          },
        },
      });
      organisationMemberId = orgMember?.id || null;
    }

    const member = await prisma.leaderboardMember.upsert({
      where: {
        leaderboardId_userId: {
          leaderboardId,
          userId: user.id,
        },
      },
      create: {
        leaderboardId,
        userId: user.id,
        organisationMemberId,
      },
      update: {
        leftAt: null,
        muted: false,
      },
    });

    return NextResponse.json({ member });
  } catch (error: any) {
    console.error('Error joining leaderboard:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to join leaderboard' },
      { status: 500 }
    );
  }
}


