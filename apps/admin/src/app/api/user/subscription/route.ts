import { NextRequest, NextResponse } from "next/server";
import { handleApiError, UnauthorizedError } from "@/lib/api-error";
import { requireApiAuth } from "@/lib/api-auth";

/**
 * Get subscription data for the authenticated user
 */
async function getSubscriptionData() {
  const user = await requireApiAuth();

  // Determine tier: premium if tier is "premium" OR subscription is active
  const isPremium = 
    user.tier === 'premium' || 
    (user.subscriptionStatus === 'ACTIVE' || user.subscriptionStatus === 'TRIALING') ||
    (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date());

  return {
    tier: isPremium ? 'premium' : 'basic',
    status: user.subscriptionStatus || 'FREE_TRIAL',
    plan: user.subscriptionPlan,
    subscriptionEndsAt: user.subscriptionEndsAt?.toISOString() || null,
    freeTrialUntil: user.freeTrialUntil?.toISOString() || null,
    freeTrialStartedAt: user.freeTrialStartedAt?.toISOString() || null,
    freeTrialEndsAt: user.freeTrialEndsAt?.toISOString() || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const data = await getSubscriptionData();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

