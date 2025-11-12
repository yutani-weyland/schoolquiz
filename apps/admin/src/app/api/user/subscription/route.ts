import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@schoolquiz/db";
import { handleApiError, UnauthorizedError, InternalServerError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

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
        logger.debug('NextAuth not available:', err);
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
    } catch (dbError: unknown) {
      logger.error('Database error in getUserFromToken:', dbError);
      // If it's a connection error, throw it up to be handled
      if (dbError instanceof Error && (dbError.message?.includes('connect') || dbError.message?.includes('P1001'))) {
        throw dbError;
      }
      // For other DB errors (like user not found), return null
      return null;
    }
  } catch (error: unknown) {
    logger.error('Error in getUserFromToken:', error);
    // Re-throw connection errors, but return null for other errors
    if (error instanceof Error && (error.message?.includes('connect') || error.message?.includes('P1001'))) {
      throw error;
    }
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      throw new UnauthorizedError();
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
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

