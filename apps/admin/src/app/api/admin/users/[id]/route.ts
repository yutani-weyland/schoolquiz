import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'


/**
 * GET /api/admin/users/[id]
 * Get user details (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Add proper admin role check

    const { id } = await params

    try {
      // First, try to get user without achievements (which may not exist)
      let user: any
      try {
        user = await prisma.user.findUnique({
          where: { id },
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
            } as any,
          },
        } as any,
      }) as any

        // Try to add achievements if the table exists
        try {
          const userWithAchievements = await prisma.user.findUnique({
            where: { id },
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
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Transform to match expected format
      const formattedUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        tier: user.tier,
        platformRole: user.platformRole,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionEndsAt: user.subscriptionEndsAt?.toISOString() || null,
        freeTrialStartedAt: user.freeTrialStartedAt?.toISOString() || null,
        freeTrialEndsAt: user.freeTrialEndsAt?.toISOString() || null,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        freeMonthsGranted: (user as any).freeMonthsGranted || 0, // Use freeMonthsGranted instead of referralCount
        freeTrialUntil: user.freeTrialUntil?.toISOString() || null,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
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

      return NextResponse.json({ user: formattedUser })
    } catch (dbError: any) {
      // Log the actual database error for debugging
      console.error('❌ Database query failed:', dbError)
      console.error('Error message:', dbError.message)
      console.error('Error code:', dbError.code)

      return NextResponse.json(
        { error: 'Failed to fetch user', details: dbError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Add proper admin role check

    const { id } = await params
    const body = await request.json()

    // Validate allowed fields
    const allowedFields = [
      'name',
      'tier',
      'platformRole',
      'subscriptionStatus',
      'subscriptionPlan',
      'subscriptionEndsAt',
    ]
    const updateData: any = {}

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    // Handle date fields
    if (body.subscriptionEndsAt) {
      updateData.subscriptionEndsAt = new Date(body.subscriptionEndsAt)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        platformRole: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      user: {
        ...user,
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Add proper admin role check

    const { id } = await params

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    )
  }
}

