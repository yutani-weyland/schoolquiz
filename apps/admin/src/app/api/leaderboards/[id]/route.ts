import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAuth } from '@/lib/auth';
import { getOrganisationContext, requirePermission } from '@schoolquiz/db';
import { logOrganisationActivity } from '@schoolquiz/db';
import { OrganisationActivityType } from '@prisma/client';

/**
 * DELETE /api/leaderboards/:id
 * Delete a leaderboard (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const leaderboardId = params.id;

    const leaderboard = await prisma.leaderboard.findUnique({
      where: { id: leaderboardId },
    });

    if (!leaderboard || leaderboard.deletedAt) {
      return NextResponse.json(
        { error: 'Leaderboard not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (leaderboard.organisationId) {
      const context = await getOrganisationContext(leaderboard.organisationId, user.id);
      requirePermission(context, 'org:leaderboards:manage');
    } else if (leaderboard.createdByUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only the creator can delete this leaderboard' },
        { status: 403 }
      );
    }

    await prisma.leaderboard.update({
      where: { id: leaderboardId },
      data: { deletedAt: new Date() },
    });

    if (leaderboard.organisationId) {
      await logOrganisationActivity(
        leaderboard.organisationId,
        user.id,
        OrganisationActivityType.LEADERBOARD_DELETED,
        { leaderboardId, name: leaderboard.name }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting leaderboard:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete leaderboard' },
      { status: error.message?.includes('Permission') ? 403 : 500 }
    );
  }
}

