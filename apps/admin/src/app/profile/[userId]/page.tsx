'use client'

import { useState, useEffect } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContentCard } from '@/components/layout/ContentCard'
import { AchievementCard } from '@/components/achievements/AchievementCard'
import { useRouter, useParams } from 'next/navigation'
import { useUserTier } from '@/hooks/useUserTier'
import type { UserTier } from '@/lib/feature-gating'
import { Trophy, Crown, Edit2, Settings, Calendar, TrendingUp, Flame, Award } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params?.userId as string
  const { tier: hookTier, isPremium } = useUserTier()
  const tier: UserTier = hookTier === 'basic' ? 'free' : (hookTier as UserTier)
  
  const [profile, setProfile] = useState<any>(null)
  const [seasonStats, setSeasonStats] = useState<any>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState('2025')
  const [isEditingFavourites, setIsEditingFavourites] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const currentUserId = localStorage.getItem('userId')
        
        if (!token || !currentUserId) {
          router.push('/sign-in')
          return
        }

        const targetUserId = userId || currentUserId

        // Fetch profile
        const profileRes = await fetch(`/api/profile/${targetUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Id': currentUserId,
          },
        })

        if (!profileRes.ok) {
          throw new Error('Failed to load profile')
        }

        const profileData = await profileRes.json()
        setProfile(profileData)

        // Fetch season stats
        const statsRes = await fetch(`/api/seasons/stats?season=${selectedSeason}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Id': currentUserId,
          },
        })

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setSeasonStats(statsData)
        }

        // Fetch achievements
        const achievementsRes = await fetch('/api/achievements/user', {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Id': currentUserId,
          },
        })

        if (achievementsRes.ok) {
          const achievementsData = await achievementsRes.json()
          setAchievements(achievementsData.achievements || [])
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [userId, selectedSeason, router])

  if (isLoading) {
    return (
      <PageLayout>
        <PageContainer maxWidth="6xl">
          <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
            </div>
          </div>
        </PageContainer>
      </PageLayout>
    )
  }

  if (!profile) {
    return (
      <PageLayout>
        <PageContainer maxWidth="6xl">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Profile not found</p>
          </div>
        </PageContainer>
      </PageLayout>
    )
  }

  const isOwnProfile = profile.isOwnProfile
  const favouriteAchievementIds = profile.favouriteAchievementIds || []
  const favouriteAchievements = achievements.filter((a) =>
    favouriteAchievementIds.includes(a.achievementId)
  )

  return (
    <PageLayout>
      <PageContainer maxWidth="6xl">
        {/* Header Section */}
        <ContentCard padding="xl" rounded="3xl" hoverAnimation={false} className="mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl text-white font-bold">
                {profile.avatar || profile.name?.[0]?.toUpperCase() || '👤'}
              </div>
              {profile.selectedFlair && (
                <div className="absolute -bottom-2 -right-2">
                  <Crown className="w-6 h-6 text-yellow-500" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {profile.displayName || profile.name || 'Anonymous'}
                  </h1>
                  {profile.tagline && (
                    <p className="text-gray-600 dark:text-gray-400 italic">
                      {profile.tagline}
                    </p>
                  )}
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/account')}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Edit2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
              </div>

              {/* Tier Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isPremium
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {isPremium ? (
                    <>
                      <Crown className="w-3 h-3 inline mr-1" />
                      Premium
                    </>
                  ) : (
                    'Free'
                  )}
                </span>
              </div>
            </div>
          </div>
        </ContentCard>

        {/* Favourite Achievements */}
        <ContentCard padding="xl" rounded="3xl" hoverAnimation={false} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Favourite Achievements
            </h2>
            {isOwnProfile && (
              <button
                onClick={() => setIsEditingFavourites(!isEditingFavourites)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {isEditingFavourites ? 'Done' : 'Edit'}
              </button>
            )}
          </div>

          {favouriteAchievements.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {isOwnProfile ? (
                <p>Pin your favourite achievements here</p>
              ) : (
                <p>No favourite achievements yet</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favouriteAchievements.map((achievement: any) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={{
                    id: achievement.achievementId,
                    slug: achievement.achievementSlug,
                    name: achievement.achievementName,
                    shortDescription: achievement.achievementDescription,
                    category: achievement.achievementCategory,
                    rarity: achievement.achievementRarity,
                    isPremiumOnly: false, // Would need to fetch from achievement definition
                    iconKey: achievement.achievementIconKey,
                  }}
                  status="unlocked"
                  unlockedAt={achievement.unlockedAt}
                  tier={tier}
                />
              ))}
            </div>
          )}
        </ContentCard>

        {/* Season Progress */}
        {seasonStats && (
          <ContentCard padding="xl" rounded="3xl" hoverAnimation={false} className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {seasonStats.currentSeason?.name || '2025 Season'} Progress
              </h2>
              {seasonStats.availableSeasons && seasonStats.availableSeasons.length > 1 && (
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm border-none outline-none"
                >
                  {seasonStats.availableSeasons.map((season: any) => (
                    <option key={season.slug} value={season.slug}>
                      {season.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {seasonStats.stats.quizzesPlayed}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Quizzes Played</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {seasonStats.stats.averageScore?.toFixed(1) || '0'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Score</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 text-orange-500" />
                  {seasonStats.stats.currentStreakWeeks}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Week Streak</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {seasonStats.stats.achievementsUnlocked}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Achievements</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Weekly Progress
                </span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {seasonStats.stats.quizzesPlayed} / 40 weeks
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min((seasonStats.stats.quizzesPlayed / 40) * 100, 100)}%`,
                  }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
            </div>
          </ContentCard>
        )}

        {/* Flair Section (Premium only) */}
        {isOwnProfile && (
          <ContentCard padding="xl" rounded="3xl" hoverAnimation={false}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Award className="w-5 h-5" />
              Flair & Titles
            </h2>
            {isPremium ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Flair selection coming soon</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4 opacity-50" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Premium players can unlock profile flair and titles
                </p>
                <button
                  onClick={() => router.push('/account?tab=subscription')}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
                >
                  Upgrade to Premium
                </button>
              </div>
            )}
          </ContentCard>
        )}
      </PageContainer>
    </PageLayout>
  )
}
