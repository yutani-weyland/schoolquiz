import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@schoolquiz/db";

/**
 * Get user from token-based auth (localStorage token system)
 */
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  
  // Try to get userId from custom header (sent by client)
  let userId: string | null = request.headers.get("X-User-Id");
  
  // If not in header, try to extract from mock token format: "mock-token-{userId}-{timestamp}"
  if (!userId && token.startsWith("mock-token-")) {
    const parts = token.split("-");
    if (parts.length >= 3) {
      userId = parts.slice(2, -1).join("-"); // Get everything between "mock-token" and timestamp
    }
  }
  
  // If still no userId, try NextAuth session as fallback
  if (!userId) {
    try {
      const { getServerSession } = await import('next-auth');
      const { authOptions } = await import('@schoolquiz/auth');
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch {
      // NextAuth not available, continue
    }
  }

  if (!userId) {
    return null;
  }

  // Fetch user from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Determine tier: premium if tier is "premium" OR subscription is active
    const isPremium = 
      user.tier === 'premium' || 
      (user.subscriptionStatus === 'ACTIVE' || user.subscriptionStatus === 'TRIALING') ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date());

    return NextResponse.json({
      tier: isPremium ? 'premium' : 'basic',
      status: user.subscriptionStatus || 'FREE_TRIAL',
      plan: user.subscriptionPlan,
      subscriptionEndsAt: user.subscriptionEndsAt?.toISOString() || null,
      freeTrialUntil: user.freeTrialUntil?.toISOString() || null,
      freeTrialStartedAt: user.freeTrialStartedAt?.toISOString() || null,
      freeTrialEndsAt: user.freeTrialEndsAt?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subscription" },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

