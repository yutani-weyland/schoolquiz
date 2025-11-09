import type { APIRoute } from "astro";
import { prisma } from "@schoolquiz/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Helper to generate JWT token
function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "30d" });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { method, email, phone, signupCode } = await request.json();

    // Validate input
    if (!method || !["email", "phone", "code"].includes(method)) {
      return new Response(
        JSON.stringify({ error: "Invalid signin method" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          method === "email" && email ? { email } : undefined,
          method === "phone" && phone ? { phone } : undefined,
          method === "code" && signupCode ? { signupCode } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const token = generateToken(user.id, user.email || "");

    return new Response(
      JSON.stringify({
        success: true,
        token,
        userId: user.id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        freeTrialEndsAt: user.freeTrialEndsAt,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Signin error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

