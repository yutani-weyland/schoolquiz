import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { handleApiError, ForbiddenError, NotFoundError } from "@/lib/api-error";
import { prisma } from "@schoolquiz/db";
import { validateRequest } from '@/lib/api-validation';
import { UpdateTeamSchema } from '@/lib/validation/schemas';

/**
 * Check if user is premium
 */
function checkPremium(user: any): boolean {
  return (
    user.tier === 'premium' ||
    user.subscriptionStatus === 'ACTIVE' ||
    user.subscriptionStatus === 'TRIALING' ||
    (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
  );
}

/**
 * GET /api/user/teams/[id]
 * Get a specific team
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiAuth();
    
    // Check if user is premium
    if (!checkPremium(user)) {
      throw new ForbiddenError('Teams feature is only available to premium users');
    }

    const { id } = await params;

    const team = await prisma.team.findFirst({
      where: {
        id,
        userId: user.id, // Ensure user owns the team
      },
      include: {
        _count: {
          select: {
            quizCompletions: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    return NextResponse.json({
      id: team.id,
      name: team.name,
      color: team.color,
      isDefault: team.isDefault,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
      quizCount: team._count.quizCompletions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/user/teams/[id]
 * Update a team
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiAuth();
    
    // Check if user is premium
    if (!checkPremium(user)) {
      throw new ForbiddenError('Teams feature is only available to premium users');
    }

    const { id } = await params;
    const body = await validateRequest(request, UpdateTeamSchema);

    // Verify team exists and belongs to user
    const existingTeam = await prisma.team.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingTeam) {
      throw new NotFoundError('Team not found');
    }

    // If updating name, check for duplicates
    if (body.name && body.name.trim() !== existingTeam.name) {
      const duplicateTeam = await prisma.team.findUnique({
        where: {
          userId_name: {
            userId: user.id,
            name: body.name.trim(),
          },
        },
      });

      if (duplicateTeam) {
        return NextResponse.json(
          { error: 'A team with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update the team
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.color !== undefined && { color: body.color }),
      },
      include: {
        _count: {
          select: {
            quizCompletions: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedTeam.id,
      name: updatedTeam.name,
      color: updatedTeam.color,
      isDefault: updatedTeam.isDefault,
      createdAt: updatedTeam.createdAt.toISOString(),
      updatedAt: updatedTeam.updatedAt.toISOString(),
      quizCount: updatedTeam._count.quizCompletions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/user/teams/[id]
 * Delete a team
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiAuth();
    
    // Check if user is premium
    if (!checkPremium(user)) {
      throw new ForbiddenError('Teams feature is only available to premium users');
    }

    const { id } = await params;

    // Verify team exists and belongs to user
    const team = await prisma.team.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            quizCompletions: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Prevent deleting default team if there are other teams
    if (team.isDefault) {
      const otherTeamsCount = await prisma.team.count({
        where: {
          userId: user.id,
          id: { not: id },
        },
      });

      if (otherTeamsCount > 0) {
        return NextResponse.json(
          { error: 'Cannot delete default team. Please set another team as default first.' },
          { status: 400 }
        );
      }
    }

    // Delete the team (completions will have teamId set to null due to onDelete: SetNull)
    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
