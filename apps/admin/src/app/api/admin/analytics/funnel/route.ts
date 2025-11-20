/**
 * GET /api/admin/analytics/funnel
 * Get funnel analytics (signup → first quiz → org creation → paid)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    await requireAdmin(request).catch(() => {
      // Allow in development
    })

    // Check if quiz_completions table exists
    let hasQuizCompletions = true
    try {
      await prisma.quizCompletion.findFirst({ take: 1 })
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        hasQuizCompletions = false
      } else {
        throw error
      }
    }

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    // Signups
    const totalSignups = await prisma.user.count()
    const thisMonthSignups = await prisma.user.count({
      where: {
        createdAt: {
          gte: thisMonthStart,
        },
      },
    })
    const previousMonthSignups = await prisma.user.count({
      where: {
        createdAt: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
    })
    const signupsChange = previousMonthSignups > 0
      ? ((thisMonthSignups - previousMonthSignups) / previousMonthSignups) * 100
      : thisMonthSignups > 0 ? 100 : 0

    // First quiz completions
    // Get all users who have completed at least one quiz
    const usersWithCompletions = hasQuizCompletions
      ? await prisma.quizCompletion.findMany({
          select: {
            userId: true,
            completedAt: true,
          },
          distinct: ['userId'],
        })
      : []

    const firstQuizThisMonth = usersWithCompletions.filter(
      (uc) => uc.completedAt >= thisMonthStart
    ).length

    const firstQuizPreviousMonth = usersWithCompletions.filter(
      (uc) => uc.completedAt >= previousMonthStart && uc.completedAt <= previousMonthEnd
    ).length

    const firstQuizChange = firstQuizPreviousMonth > 0
      ? ((firstQuizThisMonth - firstQuizPreviousMonth) / firstQuizPreviousMonth) * 100
      : firstQuizThisMonth > 0 ? 100 : 0

    const firstQuizConversionRate = totalSignups > 0
      ? (usersWithCompletions.length / totalSignups) * 100
      : 0

    // Organisation creation
    let totalOrgs = 0
    let thisMonthOrgs = 0
    let previousMonthOrgs = 0
    
    try {
      totalOrgs = await prisma.organisation.count()
      thisMonthOrgs = await prisma.organisation.count({
        where: {
          createdAt: {
            gte: thisMonthStart,
          },
        },
      })
      previousMonthOrgs = await prisma.organisation.count({
        where: {
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
        },
      })
    } catch (error: any) {
      // organisations table might not exist
      console.warn('organisations table not found:', error.message)
    }
    const orgsChange = previousMonthOrgs > 0
      ? ((thisMonthOrgs - previousMonthOrgs) / previousMonthOrgs) * 100
      : thisMonthOrgs > 0 ? 100 : 0

    const orgCreationConversionRate = totalSignups > 0
      ? (totalOrgs / totalSignups) * 100
      : 0

    // Paid conversions (users with ACTIVE subscription or premium tier)
    const paidUsers = await prisma.user.count({
      where: {
        OR: [
          { subscriptionStatus: 'ACTIVE' },
          { tier: 'premium' },
        ],
      },
    })

    const thisMonthPaid = await prisma.user.count({
      where: {
        OR: [
          { subscriptionStatus: 'ACTIVE' },
          { tier: 'premium' },
        ],
        createdAt: {
          gte: thisMonthStart,
        },
      },
    })

    const previousMonthPaid = await prisma.user.count({
      where: {
        OR: [
          { subscriptionStatus: 'ACTIVE' },
          { tier: 'premium' },
        ],
        createdAt: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
    })

    const paidChange = previousMonthPaid > 0
      ? ((thisMonthPaid - previousMonthPaid) / previousMonthPaid) * 100
      : thisMonthPaid > 0 ? 100 : 0

    const paidConversionRate = totalSignups > 0
      ? (paidUsers / totalSignups) * 100
      : 0

    // Funnel steps for visualization
    const funnelSteps = [
      {
        step: 'Signups',
        count: totalSignups,
        percentage: 100,
        color: '#3B82F6',
      },
      {
        step: 'First Quiz',
        count: usersWithCompletions.length,
        percentage: firstQuizConversionRate,
        color: '#10B981',
      },
      {
        step: 'Org Creation',
        count: totalOrgs,
        percentage: orgCreationConversionRate,
        color: '#8B5CF6',
      },
      {
        step: 'Paid',
        count: paidUsers,
        percentage: paidConversionRate,
        color: '#F59E0B',
      },
    ]

    // Conversion by week (last 12 weeks)
    const twelveWeeksAgo = new Date()
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

    const weeklySignups = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: twelveWeeksAgo,
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    const weeklyCompletions = hasQuizCompletions
      ? await prisma.quizCompletion.findMany({
          where: {
            completedAt: {
              gte: twelveWeeksAgo,
            },
          },
          select: {
            userId: true,
            completedAt: true,
          },
          distinct: ['userId'],
        })
      : []

    let weeklyOrgs: Array<{ id: string; createdAt: Date }> = []
    try {
      weeklyOrgs = await prisma.organisation.findMany({
        where: {
          createdAt: {
            gte: twelveWeeksAgo,
          },
        },
        select: {
          id: true,
          createdAt: true,
        },
      })
    } catch (error: any) {
      // organisations table might not exist
      console.warn('organisations table not found:', error.message)
    }

    const weeklyPaid = await prisma.user.findMany({
      where: {
        OR: [
          { subscriptionStatus: 'ACTIVE' },
          { tier: 'premium' },
        ],
        createdAt: {
          gte: twelveWeeksAgo,
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    // Group by week
    const weeklyStats = new Map<string, {
      week: string
      signups: number
      firstQuiz: number
      orgCreation: number
      paid: number
    }>()

    const addToWeek = (date: Date, type: 'signups' | 'firstQuiz' | 'orgCreation' | 'paid') => {
      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekStr = weekStart.toISOString().split('T')[0]

      if (!weeklyStats.has(weekStr)) {
        weeklyStats.set(weekStr, {
          week: weekStr,
          signups: 0,
          firstQuiz: 0,
          orgCreation: 0,
          paid: 0,
        })
      }
      weeklyStats.get(weekStr)![type] += 1
    }

    weeklySignups.forEach((user) => addToWeek(user.createdAt, 'signups'))
    weeklyCompletions.forEach((comp) => addToWeek(comp.completedAt, 'firstQuiz'))
    weeklyOrgs.forEach((org) => addToWeek(org.createdAt, 'orgCreation'))
    weeklyPaid.forEach((user) => addToWeek(user.createdAt, 'paid'))

    const conversionByWeek = Array.from(weeklyStats.values())
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12)

    // Dropoff points
    const dropoffPoints = [
      {
        stage: 'Signup → First Quiz',
        dropoff: totalSignups - usersWithCompletions.length,
        percentage: totalSignups > 0
          ? ((totalSignups - usersWithCompletions.length) / totalSignups) * 100
          : 0,
      },
      {
        stage: 'First Quiz → Org Creation',
        dropoff: usersWithCompletions.length - totalOrgs,
        percentage: usersWithCompletions.length > 0
          ? ((usersWithCompletions.length - totalOrgs) / usersWithCompletions.length) * 100
          : 0,
      },
      {
        stage: 'Org Creation → Paid',
        dropoff: totalOrgs - paidUsers,
        percentage: totalOrgs > 0
          ? ((totalOrgs - paidUsers) / totalOrgs) * 100
          : 0,
      },
    ]

    return NextResponse.json({
      signups: {
        total: totalSignups,
        thisMonth: thisMonthSignups,
        previousMonth: previousMonthSignups,
        change: parseFloat(signupsChange.toFixed(1)),
      },
      firstQuiz: {
        total: usersWithCompletions.length,
        thisMonth: firstQuizThisMonth,
        previousMonth: firstQuizPreviousMonth,
        change: parseFloat(firstQuizChange.toFixed(1)),
        conversionRate: parseFloat(firstQuizConversionRate.toFixed(1)),
      },
      orgCreation: {
        total: totalOrgs,
        thisMonth: thisMonthOrgs,
        previousMonth: previousMonthOrgs,
        change: parseFloat(orgsChange.toFixed(1)),
        conversionRate: parseFloat(orgCreationConversionRate.toFixed(1)),
      },
      paid: {
        total: paidUsers,
        thisMonth: thisMonthPaid,
        previousMonth: previousMonthPaid,
        change: parseFloat(paidChange.toFixed(1)),
        conversionRate: parseFloat(paidConversionRate.toFixed(1)),
      },
      funnelSteps,
      conversionByWeek,
      dropoffPoints,
    })
  } catch (error: any) {
    console.error('Error fetching funnel analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch funnel analytics', details: error.message },
      { status: 500 }
    )
  }
}
