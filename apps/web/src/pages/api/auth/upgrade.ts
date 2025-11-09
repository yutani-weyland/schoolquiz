import type { APIRoute } from "astro";
import { prisma } from "@schoolquiz/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const POST: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.substring(7);
    let decoded: any;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { plan } = await request.json();

    if (!plan || !["monthly", "annual"].includes(plan)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Calculate subscription end date
    const subscriptionEndsAt = new Date();
    if (plan === "monthly") {
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);
    } else {
      subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);
    }

    // Update user subscription
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: plan === "monthly" ? "PREMIUM_MONTHLY" : "PREMIUM_ANNUAL",
        subscriptionEndsAt,
      },
    });

    // In a real app, you would integrate with Stripe or another payment processor here
    // For now, we'll return a success response
    // TODO: Integrate with Stripe Checkout
    const checkoutUrl = `/upgrade/success?plan=${plan}`;

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl,
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: plan === "monthly" ? "PREMIUM_MONTHLY" : "PREMIUM_ANNUAL",
        subscriptionEndsAt: subscriptionEndsAt.toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Upgrade error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

