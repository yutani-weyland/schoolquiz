import { NextResponse } from "next/server";

// Mock user data - replace with actual database queries
const MOCK_USER = {
  id: "user-andrew-123",
  email: "andrew@example.com",
  name: "Andrew",
  teamName: "Quiz Masters",
  organisationName: undefined,
  profileVisibility: "PUBLIC",
  avatar: "👤",
};

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // In a real app, verify the token and fetch user from database
    // For now, return mock data
    return NextResponse.json({
      ...MOCK_USER,
      id: MOCK_USER.id, // Ensure id is included
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
    
    // In a real app, update the database
    // For now, return updated mock data
    const updatedUser = {
      ...MOCK_USER,
      ...updates,
    };

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

