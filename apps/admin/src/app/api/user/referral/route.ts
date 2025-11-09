import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAuth } from '@/lib/auth';
import crypto from 'crypto';

/**
 * GET /api/user/referral
 * Get user's referral code and count
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Generate referral code if it doesn't exist
    let referralCode = user.referralCode;
    if (!referralCode) {
      // Generate a unique referral code (8 characters, alphanumeric)
      let code: string;
      let exists = true;
      while (exists) {
        code = crypto.randomBytes(4).toString('hex').toUpperCase();
        const existing = await prisma.user.findUnique({
          where: { referralCode: code },
        });
        exists = !!existing;
      }
      referralCode = code!;

      // Update user with referral code
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode },
      });
    }

    return NextResponse.json({
      referralCode,
      referralCount: user.referralCount || 0,
    });
  } catch (error: any) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch referral data' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/user/referral/verify
 * Verify and process a referral when a new user signs up
 * This should be called during signup if a referral code is provided
 */
export async function POST(request: NextRequest) {
  try {
    const { referralCode, newUserId } = await request.json();

    if (!referralCode || !newUserId) {
      return NextResponse.json(
        { error: 'Referral code and user ID are required' },
        { status: 400 }
      );
    }

    // Find the referrer
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Check if user is already referred
    const newUser = await prisma.user.findUnique({
      where: { id: newUserId },
    });

    if (!newUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Don't allow self-referral
    if (referrer.id === newUserId) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      );
    }

    // Check if user is already referred by someone
    if (newUser.referredBy) {
      return NextResponse.json(
        { error: 'User already has a referrer' },
        { status: 400 }
      );
    }

    // Update new user with referrer
    await prisma.user.update({
      where: { id: newUserId },
      data: { referredBy: referrer.id },
    });

    // Increment referrer's count
    const updatedReferrer = await prisma.user.update({
      where: { id: referrer.id },
      data: {
        referralCount: {
          increment: 1,
        },
      },
    });

    // Check if referrer has reached 3 referrals
    if (updatedReferrer.referralCount >= 3 && updatedReferrer.tier === 'basic') {
      // Grant 1 month free premium
      const freeTrialUntil = new Date();
      freeTrialUntil.setMonth(freeTrialUntil.getMonth() + 1);

      await prisma.user.update({
        where: { id: referrer.id },
        data: {
          tier: 'premium',
          freeTrialUntil,
        },
      });
    }

    return NextResponse.json({
      success: true,
      referralCount: updatedReferrer.referralCount,
      upgraded: updatedReferrer.referralCount >= 3,
    });
  } catch (error: any) {
    console.error('Error processing referral:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process referral' },
      { status: 500 }
    );
  }
}

