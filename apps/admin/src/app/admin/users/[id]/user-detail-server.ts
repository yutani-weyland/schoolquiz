/**
 * Server-side function to fetch user details
 * Reuses logic from API route but can be called directly from server components
 */

import { prisma } from '@schoolquiz/db'
import { unstable_cache } from 'next/cache'
import { CACHE_TTL, CACHE_TAGS, createCacheKey } from '@/lib/cache-config'

export interface UserDetail {
  id: string
  name?: string | null
  email: string
  phone?: string | null
  tier: string
  platformRole?: string | null
  subscriptionStatus: string
  subscriptionPlan?: string | null
  subscriptionEndsAt?: string | null
  emailVerified: boolean
  phoneVerified: boolean
  referralCode?: string | null
  referredBy?: string | null
  referralCount?: number
  freeTrialUntil?: string | null
  lastLoginAt?: string | null
  createdAt: string
  organisationMembers: Array<{
    id: string
    role: string
    status: string
    organisation: {
      id: string
      name: string
      status: string
    }
    createdAt: string
  }>
  createdOrganisations: Array<{
    id: string
    name: string
    status: string
  }>
  quizCompletions: Array<{
    id: string
    completedAt: string
    quiz: {
      id: string
      slug: string
      title: string
    }
    score?: number
    totalQuestions?: number
  }>
  achievements: Array<{
    id: string
    unlockedAt: string
    achievement: {
      id: string
      name: string
      rarity: string
    }
  }>
  referrer?: {
    id: string
    name?: string | null
    email: string
    referralCode?: string | null
  } | null
  referrals: Array<{
    id: string
    name?: string | null
    email: string
    createdAt: string
  }>
  _count: {
    organisationMembers: number
    quizCompletions: number
    achievements: number
    referrals: number
    createdOrganisations: number
  }
}

/**
 * Internal function to fetch user details from database
 */
async function getUserDetailInternal(userId: string): Promise<UserDetail | null> {
  try {
    // First, try to get user without achievements (which may not exist)
    let user: any
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          organisationMembers: {
            include: {
              organisation: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
          referrer: {
            select: {
              id: true,
              name: true,
              email: true,
              referralCode: true,
            },
          },
          referrals: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          quizCompletions: {
            take: 10,
            orderBy: {
              completedAt: 'desc',
            },
            select: {
              id: true,
              quizSlug: true,
              score: true,
              totalQuestions: true,
              completedAt: true,
            },
          },
          createdOrganisations: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          _count: {
            select: {
              organisationMembers: true,
              quizCompletions: true,
              referrals: true,
              createdOrganisations: true,
            },
          },
        } as any,
      }) as any

      // Try to add achievements if the table exists
      try {
        const userWithAchievements = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            achievements: {
              take: 10,
              orderBy: {
                unlockedAt: 'desc',
              },
              include: {
                achievement: {
                  select: {
                    id: true,
                    name: true,
                    rarity: true,
                  },
                },
              },
            },
            _count: {
              select: {
                achievements: true,
              },
            },
          },
        })

        if (userWithAchievements) {
          user.achievements = userWithAchievements.achievements || []
          user._count.achievements = userWithAchievements._count?.achievements || 0
        }
      } catch (achievementsError: any) {
        // If achievements table doesn't exist, just use empty array
        console.warn('Achievements table not available:', achievementsError.message)
        user.achievements = []
        user._count.achievements = 0
      }
    } catch (userError: any) {
      // If the main query fails, check if it's a schema issue
      if (userError.message?.includes('does not exist') || userError.code === 'P2021') {
        throw userError // Re-throw to trigger fallback
      }
      throw userError
    }

    if (!user) {
      return null
    }

    // Transform to match expected format
    const formattedUser: UserDetail = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      tier: user.tier,
      platformRole: user.platformRole,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionEndsAt: user.subscriptionEndsAt?.toISOString() || null,
      freeTrialUntil: user.freeTrialUntil?.toISOString() || null,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      referralCount: user.referralCount,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      organisationMembers: user.organisationMembers.map((m: any) => ({
        id: m.id,
        role: m.role,
        status: m.status,
        organisation: {
          id: m.organisation.id,
          name: m.organisation.name,
          status: m.organisation.status,
        },
        createdAt: m.createdAt.toISOString(),
      })),
      createdOrganisations: user.createdOrganisations.map((org: any) => ({
        id: org.id,
        name: org.name,
        status: org.status,
      })),
      quizCompletions: user.quizCompletions.map((qc: any) => ({
        id: qc.id,
        completedAt: qc.completedAt.toISOString(),
        quiz: {
          id: qc.quizSlug,
          slug: qc.quizSlug,
          title: qc.quizSlug, // Use slug as title if title not available
        },
        score: qc.score,
        totalQuestions: qc.totalQuestions,
      })),
      achievements: (user.achievements || []).map((ach: any) => ({
        id: ach.id,
        unlockedAt: ach.unlockedAt.toISOString(),
        achievement: {
          id: ach.achievement.id,
          name: ach.achievement.name,
          rarity: ach.achievement.rarity,
        },
      })),
      referrer: user.referrer ? {
        id: user.referrer.id,
        name: user.referrer.name,
        email: user.referrer.email,
        referralCode: user.referrer.referralCode,
      } : null,
      referrals: user.referrals.map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        createdAt: r.createdAt.toISOString(),
      })),
      _count: {
        organisationMembers: user._count.organisationMembers,
        quizCompletions: user._count.quizCompletions,
        achievements: user._count.achievements || 0,
        referrals: user._count.referrals,
        createdOrganisations: user._count.createdOrganisations,
      },
    }

    return formattedUser
  } catch (error: any) {
    console.error('Error fetching user detail:', error)
    throw error
  }
}

/**
 * Fetch user details - cached for performance
 */
export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  return unstable_cache(
    async () => getUserDetailInternal(userId),
    createCacheKey('user-detail', { userId }),
    {
      revalidate: CACHE_TTL.DETAIL,
      tags: [CACHE_TAGS.USERS, `user-${userId}`],
    }
  )()
}

