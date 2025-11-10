import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAuth } from '@/lib/auth';
import { getOrganisationContext, requirePermission } from '@schoolquiz/db';
import { logOrganisationActivity } from '@schoolquiz/db';
import { OrganisationActivityType } from '@prisma/client';

/**
 * POST /api/organisation/:id/groups/:groupId/members
 * Add member to group
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: organisationId, groupId } = await params;
    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    const context = await getOrganisationContext(organisationId, user.id);
    requirePermission(context, 'org:groups:manage');

    // Verify group belongs to organisation
    const group = await prisma.organisationGroup.findUnique({
      where: { id: groupId },
    });

    if (!group || group.organisationId !== organisationId) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Verify member belongs to organisation
    const member = await prisma.organisationMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.organisationId !== organisationId) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    const groupMember = await prisma.organisationGroupMember.create({
      data: {
        organisationGroupId: groupId,
        organisationMemberId: memberId,
      },
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
    });

    return NextResponse.json({ groupMember }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding member to group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add member to group' },
      { status: error.message?.includes('Permission') ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/organisation/:id/groups/:groupId/members/:memberId
 * Remove member from group
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string; memberId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: organisationId, groupId, memberId } = await params;

    const context = await getOrganisationContext(organisationId, user.id);
    requirePermission(context, 'org:groups:manage');

    await prisma.organisationGroupMember.deleteMany({
      where: {
        organisationGroupId: groupId,
        organisationMemberId: memberId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing member from group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove member from group' },
      { status: error.message?.includes('Permission') ? 403 : 500 }
    );
  }
}

