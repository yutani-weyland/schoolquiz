import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAuth } from '@/lib/auth';
import { getOrganisationContext, requirePermission, canWrite } from '@schoolquiz/db';
import { logOrganisationActivity } from '@schoolquiz/db';
import { LeaderboardVisibility, OrganisationActivityType } from '@prisma/client';

/**
 * GET /api/organisation/:id/leaderboards
 * List organisation leaderboards
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: organisationId } = await params;

    const context = await getOrganisationContext(organisationId, user.id);
    requirePermission(context, 'org:view');

    const leaderboards = await prisma.leaderboard.findMany({
      where: {
        organisationId,
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
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
            leftAt: null,
          },
          select: {
            id: true,
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ leaderboards });
  } catch (error: any) {
    console.error('Error fetching leaderboards:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaderboards' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/organisation/:id/leaderboards
 * Create a new leaderboard
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: organisationId } = await params;
    const body = await request.json();
    const { name, description, visibility = 'ORG_WIDE', organisationGroupId } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const context = await getOrganisationContext(organisationId, user.id);
    
    if (visibility === 'ORG_WIDE' || visibility === 'GROUP') {
      requirePermission(context, 'org:leaderboards:create');
    } else {
      requirePermission(context, 'leaderboards:create_ad_hoc');
    }

    if (!canWrite(context)) {
      return NextResponse.json(
        { error: 'Subscription expired. Cannot create leaderboards.' },
        { status: 403 }
      );
    }

    // Validate group if provided
    if (organisationGroupId) {
      const group = await prisma.organisationGroup.findUnique({
        where: { id: organisationGroupId },
      });

      if (!group || group.organisationId !== organisationId) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }
    }

    const leaderboard = await prisma.leaderboard.create({
      data: {
        name,
        description,
        organisationId,
        organisationGroupId: organisationGroupId || null,
        visibility: visibility as LeaderboardVisibility,
        createdByUserId: user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organisationGroup: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    await logOrganisationActivity(
      organisationId,
      user.id,
      OrganisationActivityType.LEADERBOARD_CREATED,
      { leaderboardId: leaderboard.id, name, visibility }
    );

    return NextResponse.json({ leaderboard }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating leaderboard:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create leaderboard' },
      { status: error.message?.includes('Permission') ? 403 : 500 }
    );
  }
}

