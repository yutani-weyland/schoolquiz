/**
 * TEST ENDPOINT: Manually trigger referral reward
 * 
 * This allows testing the referral system without Stripe.
 * 
 * Usage:
 * POST /api/test/referral-reward
 * Body: { userId: "user-id-here" }
 * 
 * This simulates what happens when a referred user becomes Premium.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { processReferralReward } from '@/lib/referral-rewards'

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Check if user exists and was referred
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        referredBy: true,
        tier: true,
        subscriptionStatus: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.referredBy) {
      return NextResponse.json(
        { error: 'User was not referred by anyone' },
        { status: 400 }
      )
    }

    // First, make the user Premium (simulating subscription)
    await prisma.user.update({
      where: { id: userId },
      data: {
        tier: 'premium',
        subscriptionStatus: 'ACTIVE',
      },
    })

    // Then process the referral reward
    const result = await processReferralReward(userId)

    return NextResponse.json({
      success: true,
      message: 'Referral reward processed',
      result,
      user: {
        id: user.id,
        email: user.email,
        referredBy: user.referredBy,
      },
    })
  } catch (error: any) {
    console.error('Error processing test referral reward:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process referral reward' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/test/referral-reward
 * Get info about a user's referral status
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        referredBy: true,
        tier: true,
        subscriptionStatus: true,
        freeMonthsGranted: true,
        referralCode: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get referral record if exists
    const referral = await (prisma as any).referral.findUnique({
      where: { referredUserId: userId },
      include: {
        referrer: {
          select: {
            id: true,
            email: true,
            name: true,
            freeMonthsGranted: true,
          },
        },
      },
    })

    return NextResponse.json({
      user,
      referral: referral
        ? {
            id: referral.id,
            status: referral.status,
            rewardGrantedAt: referral.rewardGrantedAt,
            referrerRewarded: referral.referrerRewarded,
            referredRewarded: referral.referredRewarded,
            referrer: referral.referrer,
          }
        : null,
    })
  } catch (error: any) {
    console.error('Error fetching referral info:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch referral info' },
      { status: 500 }
    )
  }
}

