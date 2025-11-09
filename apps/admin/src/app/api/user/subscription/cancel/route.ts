import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // In a real app, cancel the subscription via Stripe or database
    // For now, return success
    // TODO: Integrate with Stripe subscription cancellation
    // TODO: Update database to mark subscription as cancelled

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
      // In real app, include currentPeriodEnd from database
      currentPeriodEnd: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}

