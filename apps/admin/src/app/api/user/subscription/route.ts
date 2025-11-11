import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@schoolquiz/db";

/**
 * Get user from token-based auth (localStorage token system)
 */
async function getUserFromToken(request: NextRequest) {
  try {
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
        const session: any = await getServerSession(authOptions as any);
        if (session?.user && 'id' in session.user) {
          userId = session.user.id;
        }
      } catch (err) {
        // NextAuth not available, continue
        console.debug('NextAuth not available:', err);
      }
    }

    if (!userId) {
      return null;
    }

    // Fetch user from database with error handling
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      return user;
    } catch (dbError: any) {
      console.error('Database error in getUserFromToken:', dbError);
      // If it's a connection error, throw it up to be handled
      if (dbError.code === 'P1001' || dbError.message?.includes('connect')) {
        throw dbError;
      }
      // For other DB errors (like user not found), return null
      return null;
    }
  } catch (error: any) {
    console.error('Error in getUserFromToken:', error);
    // Re-throw connection errors, but return null for other errors
    if (error.code === 'P1001' || error.message?.includes('connect')) {
      throw error;
    }
    return null;
  }
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
    console.error('Error stack:', error.stack);
    
    // If it's a database connection error or Prisma error, return a more specific error
    if (error.code === 'P1001' || error.message?.includes('connect') || error.message?.includes('Prisma')) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { error: "Database connection error. Please try again later." },
        { status: 503 }
      );
    }
    
    // If it's an unauthorized error, return 401
    if (error.message?.includes('Unauthorized') || error.status === 401) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Default to 500 for other errors
    return NextResponse.json(
      { error: error.message || "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

