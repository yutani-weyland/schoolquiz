import type { APIRoute } from "astro";
import { prisma } from "@schoolquiz/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Helper to generate JWT token
function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "30d" });
}

// Helper to calculate 5 weeks from now
function getTrialEndDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 35); // 5 weeks = 35 days
  return date;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { method, email, phone, signupCode } = await request.json();

    // Validate input
    if (!method || !["email", "phone", "code"].includes(method)) {
      return new Response(
        JSON.stringify({ error: "Invalid signup method" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (method === "email" && !email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (method === "phone" && !phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (method === "code" && !signupCode) {
      return new Response(
        JSON.stringify({ error: "Signup code is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          phone ? { phone } : undefined,
          signupCode ? { signupCode } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "An account with this information already exists" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create new user
    const trialStart = new Date();
    const trialEnd = getTrialEndDate();

    const user = await prisma.user.create({
      data: {
        email: method === "email" ? email : undefined,
        phone: method === "phone" ? phone : undefined,
        signupCode: method === "code" ? signupCode : undefined,
        signupMethod: method,
        freeTrialStartedAt: trialStart,
        freeTrialEndsAt: trialEnd,
        subscriptionStatus: "FREE_TRIAL",
        emailVerified: method === "email" ? false : undefined,
        phoneVerified: method === "phone" ? false : undefined,
      },
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
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

