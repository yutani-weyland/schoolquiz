import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAuth } from '@/lib/auth';
import { getOrganisationContext, requirePermission } from '@schoolquiz/db';
import { logOrganisationActivity } from '@schoolquiz/db';
import { OrganisationGroupType, OrganisationActivityType } from '@prisma/client';

/**
 * GET /api/organisation/:id/groups
 * List organisation groups
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const organisationId = params.id;

    const context = await getOrganisationContext(organisationId, user.id);
    requirePermission(context, 'org:view');

    const groups = await prisma.organisationGroup.findMany({
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
        members: {
          include: {
            member: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ groups });
  } catch (error: any) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch groups' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/organisation/:id/groups
 * Create a new organisation group
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const organisationId = params.id;
    const body = await request.json();
    const { name, type = 'CUSTOM', description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const context = await getOrganisationContext(organisationId, user.id);
    requirePermission(context, 'org:groups:create');

    const group = await prisma.organisationGroup.create({
      data: {
        organisationId,
        name,
        type: type as OrganisationGroupType,
        description,
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
      },
    });

    await logOrganisationActivity(
      organisationId,
      user.id,
      OrganisationActivityType.GROUP_CREATED,
      { groupId: group.id, name, type }
    );

    return NextResponse.json({ group }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create group' },
      { status: error.message?.includes('Permission') ? 403 : 500 }
    );
  }
}

