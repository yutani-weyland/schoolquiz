/**
 * GET /api/referral/validate
 * Validate a referral code without requiring authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Check if referral code exists
    const user = await prisma.user.findUnique({
      where: { referralCode: code.trim().toUpperCase() },
      select: {
        id: true,
        referralCode: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'Invalid referral code' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: 'Valid referral code',
    });
  } catch (error: any) {
    console.error('Error validating referral code:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}







