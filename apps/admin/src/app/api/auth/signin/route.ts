import { NextResponse } from "next/server";

// Mock user database
const MOCK_USERS = {
  "andrew": {
    id: "user-andrew-123",
    email: "andrew@example.com",
    name: "Andrew",
    password: "abc123", // In production, this would be hashed
    tier: "premium", // Premium user
  },
  "richard": {
    id: "user-richard-456",
    email: "richard@example.com",
    name: "Richard",
    password: "abc123", // In production, this would be hashed
    tier: "basic", // Basic user - will see upgrade prompts
  },
  "premium": {
    id: "user-premium-789",
    email: "premium@example.com",
    name: "Premium User",
    password: "abc123", // In production, this would be hashed
    tier: "premium", // Premium user
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, email, phone, signupCode, password } = body;

    // Handle email + password authentication
    if (method === "email" && email && password) {
      const emailLower = email.toLowerCase();
      
      // Find user by email or name
      const userKey = Object.keys(MOCK_USERS).find(
        key => 
          MOCK_USERS[key as keyof typeof MOCK_USERS].email.toLowerCase() === emailLower ||
          key.toLowerCase() === emailLower
      );
      
      if (userKey && password === "abc123") {
        const user = MOCK_USERS[userKey as keyof typeof MOCK_USERS];
        return NextResponse.json({
          token: `mock-token-${userKey}-${Date.now()}`,
          userId: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier || "basic",
        });
      } else {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }
    }

    // Handle other methods (phone, code) - for now, just return error
    return NextResponse.json(
      { error: "Email + password authentication required for testing" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

