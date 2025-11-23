/**
 * Server-side data fetching for profile page
 * Uses cookies for authentication
 */

import { cookies } from 'next/headers'
import { prisma } from '@schoolquiz/db'
import { getServerAuthUser } from '@/lib/server-auth'
import { unstable_cache } from 'next/cache'

/**
 * Fetch profile data from API (reuses existing API logic)
 * This is a server-side wrapper around the API route
 */
async function fetchProfileFromAPI(userId: string, currentUserId: string) {
  try {
    // Call the internal API logic
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            flair: true,
          },
        },
        achievements: {
          include: {
            achievement: true,
          },
          orderBy: { unlockedAt: 'desc' },
        },
        streaks: true,
        quizCompletions: {
          orderBy: { completedAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!user) {
      return null
    }

    const isOwnProfile = currentUserId === userId
    const profileVisibility = user.profileVisibility || 'PUBLIC'

    // Privacy check
    if (!isOwnProfile) {
      if (profileVisibility === 'PRIVATE') {
        return null // Will be handled as 403
      }
    }

    return {
      id: user.id,
      name: user.name,
      displayName: user.profile?.displayName || user.name,
      tagline: user.profile?.tagline,
      avatar: user.profile?.avatarUrl || user.avatar,
      avatarUrl: user.profile?.avatarUrl || user.avatar,
      teamName: user.teamName,
      profileVisibility: user.profileVisibility,
      profileColorScheme: user.profileColorScheme,
      subscriptionStatus: user.subscriptionStatus,
      createdAt: user.createdAt,
      favouriteAchievementIds: user.profile?.favouriteAchievementIds || [],
      selectedFlair: user.profile?.flair ? {
        id: user.profile.flair.id,
        slug: user.profile.flair.slug,
        name: user.profile.flair.name,
      } : null,
      selectedFlairId: user.profile?.selectedFlairId,
      achievements: user.achievements.map((a) => ({
        id: a.id,
        achievementId: a.achievementId,
        achievementSlug: a.achievement.slug,
        achievementKey: a.achievement.slug,
        quizSlug: a.quizSlug,
        metadata: a.meta,
        unlockedAt: a.unlockedAt,
      })),
      streak: user.streaks[0] ? {
        currentStreak: user.streaks[0].currentStreak,
        longestStreak: user.streaks[0].longestStreak,
        lastQuizDate: user.streaks[0].lastQuizDate,
        streakStartDate: user.streaks[0].streakStartDate,
      } : {
        currentStreak: 0,
        longestStreak: 0,
        lastQuizDate: null,
        streakStartDate: null,
      },
      recentCompletions: user.quizCompletions.map((c) => ({
        quizSlug: c.quizSlug,
        score: c.score,
        totalQuestions: c.totalQuestions,
        completedAt: c.completedAt,
        timeSeconds: c.timeSeconds,
      })),
      isOwnProfile,
    }
  } catch (error) {
    console.error('[profile-server] Error fetching profile:', error)
    return null
  }
}

/**
 * Fetch season stats
 */
async function fetchSeasonStatsUncached(userId: string, seasonSlug: string) {
  try {
    const season = await prisma.season.findUnique({
      where: { slug: seasonSlug },
    })

    if (!season) {
      return null
    }

    let seasonStats = await prisma.seasonStats.findUnique({
      where: {
        userId_seasonId: {
          userId,
          seasonId: season.id,
        },
      },
    })

    if (!seasonStats) {
      seasonStats = await prisma.seasonStats.create({
        data: {
          userId,
          seasonId: season.id,
        },
      })
    }

    const allSeasons = await prisma.season.findMany({
      orderBy: { startDate: 'desc' },
    })

    return {
      currentSeason: {
        id: season.id,
        slug: season.slug,
        name: season.name,
        startDate: season.startDate.toISOString(),
        endDate: season.endDate.toISOString(),
      },
      stats: {
        quizzesPlayed: seasonStats.quizzesPlayed,
        perfectScores: seasonStats.perfectScores,
        averageScore: seasonStats.averageScore,
        longestStreakWeeks: seasonStats.longestStreakWeeks,
        currentStreakWeeks: seasonStats.currentStreakWeeks,
        achievementsUnlocked: seasonStats.achievementsUnlocked,
        lastPlayedAt: seasonStats.lastPlayedAt?.toISOString() || null,
      },
      availableSeasons: allSeasons.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
      })),
    }
  } catch (error) {
    console.error('[profile-server] Error fetching season stats:', error)
    return null
  }
}

/**
 * Fetch user achievements
 */
async function fetchAchievementsUncached(userId: string) {
  try {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: 'desc' },
    })

    return {
      achievements: userAchievements.map((ua) => ({
        id: ua.id,
        achievementId: ua.achievementId,
        achievementSlug: ua.achievement.slug,
        achievementName: ua.achievement.name,
        achievementDescription: ua.achievement.shortDescription,
        achievementRarity: ua.achievement.rarity,
        achievementCategory: ua.achievement.category,
        achievementIconKey: ua.achievement.iconKey,
        quizSlug: ua.quizSlug,
        progressValue: ua.progressValue,
        progressMax: ua.progressMax,
        unlockedAt: ua.unlockedAt.toISOString(),
        meta: ua.meta ? JSON.parse(ua.meta) : null,
      })),
    }
  } catch (error) {
    console.error('[profile-server] Error fetching achievements:', error)
    return { achievements: [] }
  }
}

/**
 * Get profile data (server-side)
 */
export async function getProfileData(userId: string) {
  const authUser = await getServerAuthUser()
  
  if (!authUser) {
    return null
  }

  const currentUserId = authUser.userId
  const targetUserId = userId || currentUserId

  // Cache profile data for 30 seconds
  const getCachedProfile = unstable_cache(
    async (uid: string, cuid: string) => fetchProfileFromAPI(uid, cuid),
    [`profile-${targetUserId}`],
    {
      revalidate: 30,
      tags: [`profile-${targetUserId}`],
    }
  )

  return getCachedProfile(targetUserId, currentUserId)
}

/**
 * Get season stats (server-side)
 */
export async function getSeasonStats(seasonSlug: string = '2025') {
  const authUser = await getServerAuthUser()
  
  if (!authUser) {
    return null
  }

  // Cache season stats for 60 seconds
  const getCachedStats = unstable_cache(
    async (uid: string, slug: string) => fetchSeasonStatsUncached(uid, slug),
    [`season-stats-${authUser.userId}-${seasonSlug}`],
    {
      revalidate: 60,
      tags: [`season-stats-${authUser.userId}`],
    }
  )

  return getCachedStats(authUser.userId, seasonSlug)
}

/**
 * Get user achievements (server-side)
 */
export async function getUserAchievements() {
  const authUser = await getServerAuthUser()
  
  if (!authUser) {
    return { achievements: [] }
  }

  // Cache achievements for 30 seconds
  const getCachedAchievements = unstable_cache(
    async (uid: string) => fetchAchievementsUncached(uid),
    [`achievements-${authUser.userId}`],
    {
      revalidate: 30,
      tags: [`achievements-${authUser.userId}`],
    }
  )

  return getCachedAchievements(authUser.userId)
}

