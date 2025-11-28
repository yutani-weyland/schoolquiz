import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@schoolquiz/db";
import { validateRequest } from '@/lib/api-validation';
import { UpdateProfileSchema } from '@/lib/validation/schemas';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiAuth();

    // Fetch user with related data
    const userWithProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organisationMembers: {
          where: { status: 'ACTIVE' },
          include: {
            organisation: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!userWithProfile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get organisation name from first active membership
    const organisationName = userWithProfile.organisationMembers?.[0]?.organisation?.name || null;

    return NextResponse.json({
      id: userWithProfile.id,
      email: userWithProfile.email,
      name: userWithProfile.name,
      teamName: userWithProfile.teamName || "",
      organisationName,
      profileVisibility: userWithProfile.profileVisibility || "PUBLIC",
      avatar: userWithProfile.avatar || "👤",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireApiAuth();
    // Validate request body with Zod
    const body = await validateRequest(request, UpdateProfileSchema);
    const { teamName, profileVisibility, avatar } = body;

    const updates: any = {};
    
    // Apply updates (Zod already validated them)
    if (teamName !== undefined) {
      updates.teamName = teamName.trim();
    }

    if (profileVisibility !== undefined) {
      updates.profileVisibility = profileVisibility;
    }

    // Avatar is already validated by Zod schema (refine)
    if (avatar !== undefined) {
      updates.avatar = avatar;
    }
    
    // Update the database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updates,
      include: {
        organisationMembers: {
          where: { status: 'ACTIVE' },
          include: {
            organisation: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    // Get organisation name from first active membership
    const organisationName = updatedUser.organisationMembers?.[0]?.organisation?.name || null;

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      teamName: updatedUser.teamName || "",
      organisationName,
      profileVisibility: updatedUser.profileVisibility || "PUBLIC",
      avatar: updatedUser.avatar || "👤",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

