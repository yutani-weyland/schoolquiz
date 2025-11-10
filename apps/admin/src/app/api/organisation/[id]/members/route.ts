import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAuth } from '@/lib/auth';
import { getOrganisationContext, requirePermission, getAvailableSeats } from '@schoolquiz/db';
import { logOrganisationActivity } from '@schoolquiz/db';
import { OrganisationMemberStatus, OrganisationMemberRole, OrganisationActivityType } from '@prisma/client';

/**
 * GET /api/organisation/:id/members
 * List organisation members
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

    const members = await prisma.organisationMember.findMany({
      where: {
        organisationId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch members' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/organisation/:id/members/invite
 * Invite a new member to the organisation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: organisationId } = await params;
    const body = await request.json();
    const { email, role = 'TEACHER' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const context = await getOrganisationContext(organisationId, user.id);
    requirePermission(context, 'org:members:invite');

    // Check if user exists, create if not
    let targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      // Extract name from email (basic fallback)
      const name = email.split('@')[0];
      targetUser = await prisma.user.create({
        data: {
          email,
          name,
        },
      });
    }

    // Check if already a member
    const existingMember = await prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: {
          organisationId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember && !existingMember.deletedAt) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 400 }
      );
    }

    // Check available seats
    const seats = await getAvailableSeats(organisationId);
    if (seats.available <= 0 && role !== 'OWNER') {
      return NextResponse.json(
        { error: 'No available seats' },
        { status: 400 }
      );
    }

    // Validate email domain if organisation has one
    const org = await prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { emailDomain: true },
    });

    if (org?.emailDomain) {
      const emailDomain = email.split('@')[1];
      if (emailDomain !== org.emailDomain) {
        return NextResponse.json(
          { error: `Email must be from ${org.emailDomain}` },
          { status: 400 }
        );
      }
    }

    // Create or restore membership
    const member = await prisma.organisationMember.upsert({
      where: {
        organisationId_userId: {
          organisationId,
          userId: targetUser.id,
        },
      },
      create: {
        organisationId,
        userId: targetUser.id,
        role: role as OrganisationMemberRole,
        status: OrganisationMemberStatus.PENDING,
      },
      update: {
        role: role as OrganisationMemberRole,
        status: OrganisationMemberStatus.PENDING,
        deletedAt: null,
        seatReleasedAt: null,
      },
    });

    // Assign seat if role requires it
    if (role !== 'OWNER' && seats.available > 0) {
      await prisma.organisationMember.update({
        where: { id: member.id },
        data: {
          seatAssignedAt: new Date(),
          status: OrganisationMemberStatus.ACTIVE,
        },
      });
    }

    await logOrganisationActivity(
      organisationId,
      user.id,
      OrganisationActivityType.INVITE_SENT,
      { email, role, memberId: member.id }
    );

    return NextResponse.json({ member }, { status: 201 });
  } catch (error: any) {
    console.error('Error inviting member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to invite member' },
      { status: error.message?.includes('Permission') ? 403 : 500 }
    );
  }
}

