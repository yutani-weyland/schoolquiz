import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@schoolquiz/db";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiAuth();

    // Fetch user with related data
    const userWithProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
      } as any,
    });

    if (!userWithProfile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: userWithProfile.id,
      email: userWithProfile.email,
      name: userWithProfile.name,
      teamName: userWithProfile.teamName || "",
      organisationName: (userWithProfile as any).organisation?.name,
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
    const body = await request.json();
    const { teamName, profileVisibility, avatar } = body;

    const updates: any = {};
    
    // Validate and update team name
    if (teamName !== undefined) {
      if (typeof teamName !== 'string') {
        return NextResponse.json(
          { error: "Team name must be a string" },
          { status: 400 }
        );
      }
      if (teamName.length > 50) {
        return NextResponse.json(
          { error: "Team name must be 50 characters or less" },
          { status: 400 }
        );
      }
      updates.teamName = teamName.trim();
    }

    // Validate and update profile visibility
    if (profileVisibility !== undefined) {
      if (!['PUBLIC', 'LEAGUES_ONLY', 'PRIVATE'].includes(profileVisibility)) {
        return NextResponse.json(
          { error: "Invalid profile visibility setting" },
          { status: 400 }
        );
      }
      updates.profileVisibility = profileVisibility;
    }

    // Validate and update avatar (must be a single emoji)
    if (avatar !== undefined) {
      if (typeof avatar !== 'string') {
        return NextResponse.json(
          { error: "Avatar must be a string" },
          { status: 400 }
        );
      }
      // Validate it's a single emoji or empty
      if (avatar !== '' && !/^[\p{Emoji}]$/u.test(avatar)) {
        return NextResponse.json(
          { error: "Avatar must be a single emoji" },
          { status: 400 }
        );
      }
      updates.avatar = avatar;
    }
    
    // Update the database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updates,
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
      } as any,
    });

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      teamName: updatedUser.teamName || "",
      organisationName: (updatedUser as any).organisation?.name,
      profileVisibility: updatedUser.profileVisibility || "PUBLIC",
      avatar: updatedUser.avatar || "👤",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

