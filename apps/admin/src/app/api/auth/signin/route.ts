import { NextResponse } from "next/server";

// Mock user database
const MOCK_USERS = {
  "andrew": {
    id: "user-andrew-123",
    email: "andrew@example.com",
    name: "Andrew",
    password: "abc123",
    tier: "premium",
  },
  "richard": {
    id: "user-richard-456",
    email: "richard@example.com",
    name: "Richard",
    password: "abc123",
    tier: "basic",
  },
  "premium": {
    id: "user-premium-789",
    email: "premium@example.com",
    name: "Premium User",
    password: "abc123",
    tier: "premium",
  },
};

/**
 * Ensure mock user exists in database (for prototyping)
 * This is non-blocking - signin will work even if DB fails
 */
async function ensureMockUserExists(mockUser: typeof MOCK_USERS[keyof typeof MOCK_USERS]) {
  try {
    // Dynamic import to avoid build-time errors
    const { prisma } = await import("@schoolquiz/db");
    
    // Check if user exists by ID
    const existingUser = await prisma.user.findUnique({
      where: { id: mockUser.id },
    });

    if (existingUser) {
      // Update last login
      try {
        await prisma.user.update({
          where: { id: mockUser.id },
          data: { lastLoginAt: new Date() },
        });
      } catch (e) {
        // Ignore update errors
      }
      return;
    }

    // Check if email exists
    const emailUser = await prisma.user.findUnique({
      where: { email: mockUser.email },
    });

    if (emailUser) {
      // User exists with different ID - that's fine
      return;
    }

    // Create user
    await prisma.user.create({
      data: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        tier: mockUser.tier,
        subscriptionStatus: mockUser.tier === 'premium' ? 'ACTIVE' : 'FREE_TRIAL',
        lastLoginAt: new Date(),
      },
    });
  } catch (error: any) {
    // Silently fail - signin should work even without DB
    console.log('Could not create/update user in database (non-fatal):', error?.message || error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, email, phone, signupCode, password } = body;

    // Handle email + password authentication
    if (method === "email" && email && password) {
      const emailLower = email.toLowerCase();
      
      // First, check mock users
      const userKey = Object.keys(MOCK_USERS).find(
        key => 
          MOCK_USERS[key as keyof typeof MOCK_USERS].email.toLowerCase() === emailLower ||
          key.toLowerCase() === emailLower
      );
      
      if (userKey && password === "abc123") {
        const mockUser = MOCK_USERS[userKey as keyof typeof MOCK_USERS];
        
        // Try to create/update user in database (non-blocking)
        ensureMockUserExists(mockUser).catch(() => {
          // Ignore errors - signin should work regardless
        });
        
        return NextResponse.json({
          token: `mock-token-${userKey}-${Date.now()}`,
          userId: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          tier: mockUser.tier || "basic",
        });
      }

      // If not in mock users, check database
      // For testing, accept password "abc123" for any database user
      try {
        const { prisma } = await import("@schoolquiz/db");
        const dbUser = await prisma.user.findUnique({
          where: { email: emailLower },
        });

        if (dbUser && password === "abc123") {
          // Update last login
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { lastLoginAt: new Date() },
          }).catch(() => {
            // Ignore update errors
          });

          return NextResponse.json({
            token: `mock-token-${dbUser.id}-${Date.now()}`,
            userId: dbUser.id,
            email: dbUser.email,
            name: dbUser.name || "",
            tier: dbUser.tier || "basic",
          });
        }
      } catch (error) {
        // Database check failed - continue to error response
        console.log('Database check failed (non-fatal):', error);
      }
      
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Handle other methods
    return NextResponse.json(
      { error: "Email + password authentication required for testing" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { 
        error: "Invalid request",
        details: error?.message || 'Unknown error',
      },
      { status: 400 }
    );
  }
}
