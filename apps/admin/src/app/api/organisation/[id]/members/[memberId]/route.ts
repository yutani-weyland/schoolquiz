import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAuth } from '@/lib/auth';
import { getOrganisationContext, requirePermission } from '@schoolquiz/db';
import { logOrganisationActivity } from '@schoolquiz/db';
import { OrganisationMemberRole, OrganisationMemberStatus, OrganisationActivityType } from '@prisma/client';

/**
 * PATCH /api/organisation/:id/members/:memberId
 * Update member role or status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: organisationId, memberId } = await params;
    const body = await request.json();
    const { role, status } = body;

    const context = await getOrganisationContext(organisationId, user.id);
    if (!context) {
      return NextResponse.json(
        { error: 'Not a member of this organisation' },
        { status: 403 }
      );
    }
    requirePermission(context, 'org:members:update_role');

    const member = await prisma.organisationMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.organisationId !== organisationId) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent changing OWNER role unless current user is OWNER
    if (member.role === OrganisationMemberRole.OWNER && context.role !== OrganisationMemberRole.OWNER) {
      return NextResponse.json(
        { error: 'Cannot modify owner role' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (role && role !== member.role) {
      updateData.role = role as OrganisationMemberRole;
    }
    if (status && status !== member.status) {
      updateData.status = status as OrganisationMemberStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ member });
    }

    const updated = await prisma.organisationMember.update({
      where: { id: memberId },
      data: updateData,
    });

    await logOrganisationActivity(
      organisationId,
      user.id,
      OrganisationActivityType.MEMBER_ROLE_CHANGED,
      { memberId, oldRole: member.role, newRole: updated.role }
    );

    return NextResponse.json({ member: updated });
  } catch (error: any) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update member' },
      { status: error.message?.includes('Permission') ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/organisation/:id/members/:memberId
 * Remove member (soft delete and release seat)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: organisationId, memberId } = await params;

    const context = await getOrganisationContext(organisationId, user.id);
    requirePermission(context, 'org:members:remove');

    const member = await prisma.organisationMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.organisationId !== organisationId) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent removing OWNER
    if (member.role === OrganisationMemberRole.OWNER) {
      return NextResponse.json(
        { error: 'Cannot remove owner' },
        { status: 403 }
      );
    }

    // Soft delete and release seat
    await prisma.organisationMember.update({
      where: { id: memberId },
      data: {
        deletedAt: new Date(),
        status: OrganisationMemberStatus.INACTIVE,
        seatReleasedAt: member.seatAssignedAt ? new Date() : null,
      },
    });

    await logOrganisationActivity(
      organisationId,
      user.id,
      OrganisationActivityType.MEMBER_REMOVED,
      { memberId, email: member.userId }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove member' },
      { status: error.message?.includes('Permission') ? 403 : 500 }
    );
  }
}

