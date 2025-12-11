import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { handleApiError, ForbiddenError, NotFoundError } from "@/lib/api-error";
import { prisma } from "@schoolquiz/db";

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
 * POST /api/user/teams/[id]/set-default
 * Set a team as the default team
 */
export async function POST(
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
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // If already default, no need to update
    if (team.isDefault) {
      return NextResponse.json({
        id: team.id,
        name: team.name,
        color: team.color,
        isDefault: true,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
      });
    }

    // Use a transaction to ensure only one default team
    const result = await prisma.$transaction(async (tx) => {
      // Unset all other default teams
      await tx.team.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

      // Set this team as default
      const updatedTeam = await tx.team.update({
        where: { id },
        data: { isDefault: true },
      });

      return updatedTeam;
    });

    return NextResponse.json({
      id: result.id,
      name: result.name,
      color: result.color,
      isDefault: result.isDefault,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
