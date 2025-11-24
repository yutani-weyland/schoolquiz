import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import crypto from 'crypto';

/**
 * Get user from token-based auth (localStorage token system)
 */
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  let userId: string | null = request.headers.get('X-User-Id');
  
  if (!userId && token.startsWith('mock-token-')) {
    const parts = token.split('-');
    if (parts.length >= 3) {
      userId = parts.slice(2, -1).join('-');
    }
  }

  if (!userId) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    return user;
  } catch (error: any) {
    console.warn('Error fetching user for referral:', error.message);
    return null;
  }
}

/**
 * GET /api/user/referral
 * Get user's referral code and count
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Get referral stats
    const referralsMade = await (prisma as any).referral.count({
      where: { referrerId: user.id },
    })

    const rewardedReferrals = await (prisma as any).referral.count({
      where: {
        referrerId: user.id,
        status: 'REWARDED',
      },
    })

    return NextResponse.json({
      referralCode,
      freeMonthsGranted: user.freeMonthsGranted || 0,
      maxFreeMonths: 3,
      referralsMade,
      rewardedReferrals,
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
 * Verify and record a referral when a new user signs up
 * This creates a PENDING referral record - rewards are granted later when user becomes Premium
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

    // Check if referral record already exists
    const existingReferral = await (prisma as any).referral.findUnique({
      where: { referredUserId: newUserId },
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: 'Referral already exists for this user' },
        { status: 400 }
      );
    }

    // Update new user with referrer
    await prisma.user.update({
      where: { id: newUserId },
      data: { referredBy: referrer.id },
    });

    // Create referral record (status: PENDING - will be REWARDED when user becomes Premium)
    await (prisma as any).referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: newUserId,
        referralCode,
        status: 'PENDING', // Will be REWARDED when referred user becomes Premium
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Referral recorded. Rewards will be granted when you become Premium.',
    });
  } catch (error: any) {
    console.error('Error processing referral:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process referral' },
      { status: 500 }
    );
  }
}

