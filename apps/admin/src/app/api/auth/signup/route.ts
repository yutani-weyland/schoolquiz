/**
 * POST /api/auth/signup
 * Create a new user account
 * Supports referral codes via query parameter or body
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { validateRequest } from '@/lib/api-validation'
import { SignupSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api-error'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * Generate a unique referral code (8 characters, alphanumeric)
 */
function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

export async function POST(request: NextRequest) {
  try {
    // Validate request body with Zod
    const body = await validateRequest(request, SignupSchema)
    const { method, email, phone, signupCode, password, referralCode } = body

    // Check if user already exists
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        )
      }
    }

    if (phone) {
      const existingUser = await prisma.user.findUnique({
        where: { phone: phone.trim() },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this phone already exists' },
          { status: 409 }
        )
      }
    }

    // Generate unique referral code
    let userReferralCode = generateReferralCode()
    let codeExists = true
    while (codeExists) {
      const existing = await prisma.user.findUnique({
        where: { referralCode: userReferralCode },
      })
      codeExists = !!existing
      if (codeExists) {
        userReferralCode = generateReferralCode()
      }
    }

    // Hash password if provided
    let passwordHash: string | null = null
    if (password) {
      // In production, use bcrypt or similar
      // For now, we'll store a simple hash (NOT SECURE - replace with proper hashing)
      passwordHash = crypto.createHash('sha256').update(password).digest('hex')
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email?.trim().toLowerCase() || null,
        phone: phone?.trim() || null,
        passwordHash,
        signupCode: signupCode?.trim() || null,
        signupMethod: method || 'email',
        referralCode: userReferralCode,
        tier: 'basic',
        subscriptionStatus: 'FREE_TRIAL',
        emailVerified: false,
        phoneVerified: false,
      },
    })

    // Process referral code if provided
    if (referralCode) {
      try {
        const referralResponse = await fetch(
          `${request.nextUrl.origin}/api/user/referral/verify`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referralCode: referralCode.trim().toUpperCase(),
              newUserId: user.id,
            }),
          }
        )

        if (!referralResponse.ok) {
          console.error('Failed to process referral:', await referralResponse.text())
          // Don't fail signup if referral fails - just log it
        }
      } catch (error) {
        console.error('Error processing referral during signup:', error)
        // Don't fail signup if referral fails
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    return NextResponse.json({
      success: true,
      token,
      userId: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      referralCode: userReferralCode,
    })
  } catch (error: any) {
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0]
      return NextResponse.json(
        { error: `A user with this ${field} already exists` },
        { status: 409 }
      )
    }

    // Use centralized error handling (handles ValidationError automatically)
    return handleApiError(error)
  }
}

