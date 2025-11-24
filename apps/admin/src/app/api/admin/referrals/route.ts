/**
 * GET /api/admin/referrals
 * Get all referrals with stats (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // TODO: Add admin role check
    // if (user.platformRole !== 'PLATFORM_ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    // Fetch all referrals with related data
    const referrals = await (prisma as any).referral.findMany({
      include: {
        referrer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        referredUser: {
          select: {
            id: true,
            email: true,
            name: true,
            tier: true,
            subscriptionStatus: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate stats
    const totalReferrals = referrals.length
    const pendingReferrals = referrals.filter((r: any) => r.status === 'PENDING').length
    const rewardedReferrals = referrals.filter((r: any) => r.status === 'REWARDED').length

    // Calculate total free months granted
    const usersWithFreeMonths = await prisma.user.findMany({
      where: {
        freeMonthsGranted: {
          gt: 0,
        },
      },
      select: {
        freeMonthsGranted: true,
      },
    })

    const totalFreeMonthsGranted = usersWithFreeMonths.reduce(
      (sum, user) => sum + (user.freeMonthsGranted || 0),
      0
    )

    return NextResponse.json({
      referrals: referrals.map((r: any) => ({
        id: r.id,
        referrerId: r.referrerId,
        referredUserId: r.referredUserId,
        referralCode: r.referralCode,
        status: r.status,
        rewardGrantedAt: r.rewardGrantedAt?.toISOString() || null,
        referrerRewarded: r.referrerRewarded,
        referredRewarded: r.referredRewarded,
        createdAt: r.createdAt.toISOString(),
        referrer: r.referrer,
        referredUser: r.referredUser,
      })),
      stats: {
        totalReferrals,
        pendingReferrals,
        rewardedReferrals,
        totalFreeMonthsGranted,
      },
    })
  } catch (error: any) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch referrals' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}

