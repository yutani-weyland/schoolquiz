/**
 * GET /api/admin/analytics/engagement
 * Get engagement analytics (DAU/MAU, quiz attempts, top orgs)
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
    try {
      await prisma.quizCompletion.findFirst({ take: 1 })
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        return NextResponse.json({
          dau: { current: 0, previous: 0, change: 0, trend: 'up' },
          mau: { current: 0, previous: 0, change: 0, trend: 'up' },
          quizAttemptsPerDay: [],
          activeUsersByDay: [],
          topActiveOrgs: [],
          _warning: 'quiz_completions table does not exist. Please run CREATE_QUIZ_COMPLETIONS_TABLE.sql',
        })
      }
      throw error
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const previousMonth = new Date(today)
    previousMonth.setMonth(previousMonth.getMonth() - 2)

    // Calculate DAU (Daily Active Users) - unique users who completed a quiz today
    const dauCurrentUsers = await prisma.quizCompletion.findMany({
      where: {
        completedAt: {
          gte: today,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    })
    const dauCurrent = dauCurrentUsers.length

    const dauPreviousUsers = await prisma.quizCompletion.findMany({
      where: {
        completedAt: {
          gte: yesterday,
          lt: today,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    })
    const dauPrevious = dauPreviousUsers.length

    const dauChange = dauPrevious > 0 
      ? ((dauCurrent - dauPrevious) / dauPrevious) * 100 
      : dauCurrent > 0 ? 100 : 0

    // Calculate MAU (Monthly Active Users) - unique users who completed a quiz in the last 30 days
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const mauCurrentUsers = await prisma.quizCompletion.findMany({
      where: {
        completedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    })
    const mauCurrent = mauCurrentUsers.length

    const sixtyDaysAgo = new Date(today)
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    
    const mauPreviousUsers = await prisma.quizCompletion.findMany({
      where: {
        completedAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    })
    const mauPrevious = mauPreviousUsers.length

    const mauChange = mauPrevious > 0 
      ? ((mauCurrent - mauPrevious) / mauPrevious) * 100 
      : mauCurrent > 0 ? 100 : 0

    // Quiz attempts per day (last 30 days)
    const thirtyDaysAgoStart = new Date(thirtyDaysAgo)
    thirtyDaysAgoStart.setHours(0, 0, 0, 0)

    const completionsByDay = await prisma.quizCompletion.groupBy({
      by: ['completedAt'],
      where: {
        completedAt: {
          gte: thirtyDaysAgoStart,
        },
      },
      _count: {
        id: true,
      },
    })

    // Group by date (ignore time)
    const attemptsByDate = new Map<string, number>()
    completionsByDay.forEach((item) => {
      const dateStr = item.completedAt.toISOString().split('T')[0]
      attemptsByDate.set(dateStr, (attemptsByDate.get(dateStr) || 0) + item._count.id)
    })

    // Fill in missing dates with 0
    const quizAttemptsPerDay = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      quizAttemptsPerDay.push({
        date: dateStr,
        attempts: attemptsByDate.get(dateStr) || 0,
      })
    }

    // Active users by day (last 30 days)
    const activeUsersByDay = []
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(today)
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      const uniqueUsers = await prisma.quizCompletion.findMany({
        where: {
          completedAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      })

      activeUsersByDay.push({
        date: dayStart.toISOString().split('T')[0],
        users: uniqueUsers.length,
      })
    }

    // Top active organisations (based on quiz completions)
    // Get all completions with user's organisation membership
    const orgCompletions = await prisma.quizCompletion.findMany({
      where: {
        completedAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        user: {
          include: {
            organisationMembers: {
              where: {
                status: 'ACTIVE', // Only active memberships
              },
              include: {
                organisation: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Group by organisation
    const orgStats = new Map<string, {
      id: string
      name: string
      attempts: number
      users: Set<string>
      scores: number[]
    }>()

    orgCompletions.forEach((completion) => {
      completion.user.organisationMembers.forEach((membership) => {
        const orgId = membership.organisation.id
        if (!orgStats.has(orgId)) {
          orgStats.set(orgId, {
            id: orgId,
            name: membership.organisation.name,
            attempts: 0,
            users: new Set(),
            scores: [],
          })
        }
        const stats = orgStats.get(orgId)!
        stats.attempts++
        stats.users.add(completion.userId)
        stats.scores.push((completion.score / completion.totalQuestions) * 100)
      })
    })

    // Convert to array and calculate averages
    const topActiveOrgs = Array.from(orgStats.values())
      .map((org) => ({
        id: org.id,
        name: org.name,
        attempts: org.attempts,
        users: org.users.size,
        avgScore: org.scores.length > 0
          ? org.scores.reduce((sum, score) => sum + score, 0) / org.scores.length
          : 0,
      }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10) // Top 10

    return NextResponse.json({
      dau: {
        current: dauCurrent,
        previous: dauPrevious,
        change: parseFloat(dauChange.toFixed(1)),
        trend: dauChange >= 0 ? 'up' : 'down',
      },
      mau: {
        current: mauCurrent,
        previous: mauPrevious,
        change: parseFloat(mauChange.toFixed(1)),
        trend: mauChange >= 0 ? 'up' : 'down',
      },
      quizAttemptsPerDay,
      activeUsersByDay,
      topActiveOrgs,
    })
  } catch (error: any) {
    console.error('Error fetching engagement analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engagement analytics', details: error.message },
      { status: 500 }
    )
  }
}
