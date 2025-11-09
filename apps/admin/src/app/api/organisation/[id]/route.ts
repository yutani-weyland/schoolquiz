import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAuth } from '@/lib/auth';
import { getOrganisationContext, requirePermission, getAvailableSeats } from '@schoolquiz/db';

/**
 * GET /api/organisation/:id
 * Get organisation details
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

    const organisation = await prisma.organisation.findUnique({
      where: { id: organisationId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!organisation) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    const seats = await getAvailableSeats(organisationId);

    return NextResponse.json({
      organisation,
      seats,
    });
  } catch (error: any) {
    console.error('Error fetching organisation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch organisation' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

