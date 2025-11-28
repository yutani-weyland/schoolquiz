import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAuth } from '@/lib/auth';
import { getOrganisationContext, requirePermission } from '@schoolquiz/db';
import { logOrganisationActivity } from '@schoolquiz/db';
import { OrganisationActivityType } from '@prisma/client';
import { validateParams } from '@/lib/api-validation';
import { handleApiError } from '@/lib/api-error';
import { z } from 'zod';

const ParamsSchema = z.object({ id: z.string().min(1) });

/**
 * DELETE /api/leaderboards/:id
 * Delete a leaderboard (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: leaderboardId } = await validateParams(await params, ParamsSchema);

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
    // Handle permission errors
    if (error.message?.includes('Permission') || error.message?.includes('403')) {
      return NextResponse.json(
        { error: error.message || 'Permission denied' },
        { status: 403 }
      );
    }
    return handleApiError(error);
  }
}

