'use client'

import { useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContentCard } from '@/components/layout/ContentCard'
import { AchievementCard } from '@/components/achievements/AchievementCard'
import { useRouter } from 'next/navigation'
import { useUserTier } from '@/hooks/useUserTier'
import type { UserTier } from '@/lib/feature-gating'
import { Trophy, Filter } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

type AchievementStatus = 'unlocked' | 'locked_free' | 'locked_premium'
type FilterType = 'all' | 'unlocked' | 'locked'
type RarityFilter = 'all' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

interface Achievement {
  id: string
  slug: string
  name: string
  shortDescription: string
  longDescription?: string
  category: string
  rarity: string
  isPremiumOnly: boolean
  seasonTag?: string | null
  iconKey?: string | null
  status: AchievementStatus
  unlockedAt?: string
}

// Mock achievements data
const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    slug: 'hail-caesar',
    name: 'Hail Caesar',
    shortDescription: 'Get 5/5 in a History round',
    category: 'performance',
    rarity: 'common',
    isPremiumOnly: false,
    status: 'unlocked',
    unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    slug: 'addicted',
    name: 'Addicted',
    shortDescription: 'Play 3 quizzes in a single day',
    category: 'engagement',
    rarity: 'common',
    isPremiumOnly: false,
    status: 'unlocked',
    unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    slug: 'time-traveller',
    name: 'Time Traveller',
    shortDescription: 'Complete a quiz from 3+ weeks ago',
    category: 'engagement',
    rarity: 'common',
    isPremiumOnly: false,
    status: 'locked_free',
  },
  {
    id: '4',
    slug: 'deja-vu',
    name: 'Déjà Vu',
    shortDescription: 'Complete the same quiz twice',
    category: 'engagement',
    rarity: 'common',
    isPremiumOnly: false,
    status: 'locked_free',
  },
  {
    id: '5',
    slug: 'blitzkrieg',
    name: 'Blitzkrieg',
    shortDescription: 'Finish a History round under 2 minutes',
    category: 'performance',
    rarity: 'uncommon',
    isPremiumOnly: false,
    status: 'unlocked',
    unlockedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    slug: 'routine-genius',
    name: 'Routine Genius',
    shortDescription: 'Play for 4 consecutive weeks',
    category: 'engagement',
    rarity: 'uncommon',
    isPremiumOnly: false,
    status: 'locked_free',
  },
  {
    id: '7',
    slug: 'hat-trick',
    name: 'Hat Trick',
    shortDescription: 'Win 3 sports rounds',
    category: 'performance',
    rarity: 'uncommon',
    isPremiumOnly: false,
    status: 'locked_free',
  },
  {
    id: '8',
    slug: 'ace',
    name: 'Ace',
    shortDescription: 'Get 5/5 in a sports-themed round',
    category: 'performance',
    rarity: 'rare',
    isPremiumOnly: true,
    status: 'locked_premium',
  },
  {
    id: '9',
    slug: 'olympiad',
    name: 'Olympiad',
    shortDescription: 'Get 5/5 in an Olympics round',
    category: 'event',
    rarity: 'rare',
    isPremiumOnly: true,
    seasonTag: 'olympics-2026',
    status: 'locked_premium',
  },
  {
    id: '10',
    slug: 'torchbearer',
    name: 'Torchbearer',
    shortDescription: 'Play in a special Olympic event week',
    category: 'event',
    rarity: 'rare',
    isPremiumOnly: true,
    seasonTag: 'olympics-2026',
    status: 'locked_premium',
  },
  {
    id: '11',
    slug: 'term-1-champion',
    name: 'Term 1 Champion',
    shortDescription: 'Complete all quizzes in Term 1',
    category: 'engagement',
    rarity: 'epic',
    isPremiumOnly: true,
    seasonTag: '2025-term-1',
    status: 'locked_premium',
  },
  {
    id: '12',
    slug: 'all-rounder-2025',
    name: '2025 All-Rounder',
    shortDescription: 'Play at least once every term in 2025',
    category: 'engagement',
    rarity: 'epic',
    isPremiumOnly: true,
    seasonTag: '2025',
    status: 'locked_premium',
  },
  {
    id: '13',
    slug: 'iron-quizzer-2025',
    name: '2025 Iron Quizzer',
    shortDescription: 'Maintain a streak through Term 4',
    category: 'engagement',
    rarity: 'legendary',
    isPremiumOnly: true,
    seasonTag: '2025-term-4',
    status: 'locked_premium',
  },
  {
    id: '14',
    slug: 'perfect-year',
    name: 'Perfect Year',
    shortDescription: 'Complete every quiz in a full school year',
    category: 'engagement',
    rarity: 'legendary',
    isPremiumOnly: true,
    status: 'locked_premium',
  },
]

export default function AchievementsPage() {
  const router = useRouter()
  const { tier: hookTier, isPremium } = useUserTier()
  const tier: UserTier = hookTier === 'basic' ? 'free' : (hookTier as UserTier)
  
  // Use mock data for now
  const [achievements] = useState<Achievement[]>(MOCK_ACHIEVEMENTS)
  const [filter, setFilter] = useState<FilterType>('all')
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Filter achievements
  const filteredAchievements = achievements.filter((achievement) => {
    if (filter === 'unlocked' && achievement.status !== 'unlocked') return false
    if (filter === 'locked' && achievement.status === 'unlocked') return false
    if (rarityFilter !== 'all' && achievement.rarity !== rarityFilter) return false
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false
    return true
  })

  const unlockedCount = achievements.filter((a) => a.status === 'unlocked').length
  const totalCount = achievements.length

  const handleUpgradeClick = () => {
    router.push('/account?tab=subscription')
  }

  // Visitor state
  if (tier === 'visitor') {
    return (
      <PageLayout>
        <PageContainer maxWidth="6xl">
          <PageHeader
            title="Achievement Collection"
            subtitle="Create a free account to start earning achievements"
            centered
          />

          <ContentCard padding="xl" rounded="3xl" hoverAnimation={false}>
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Sign up to unlock achievements
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Create a free account to start tracking your quiz progress and earning achievements.
              </p>
              <button
                onClick={() => router.push('/sign-up')}
                className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full font-medium transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Teaser grid - all locked */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 opacity-50">
              {achievements.slice(0, 6).map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  status="locked_free"
                  tier="visitor"
                />
              ))}
            </div>
          </ContentCard>
        </PageContainer>
      </PageLayout>
    )
  }

  // Free/Premium user state
  return (
    <PageLayout>
      <PageContainer maxWidth="6xl">
        <PageHeader
          title="Achievement Collection"
          subtitle={`${unlockedCount} of ${totalCount} achievements unlocked`}
          centered
        />

        <ContentCard padding="xl" rounded="3xl" hoverAnimation={false}>
          {/* Filters */}
          <div className="mb-6 space-y-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
              {(['all', 'unlocked', 'locked'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'unlocked' ? 'Unlocked' : 'Locked'}
                </button>
              ))}
            </div>

            {/* Rarity Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rarity:</span>
              {(['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'] as RarityFilter[]).map(
                (r) => (
                  <button
                    key={r}
                    onClick={() => setRarityFilter(r)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                      rarityFilter === r
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {r}
                  </button>
                )
              )}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</span>
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              {Array.from(new Set(achievements.map((a) => a.category))).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Achievements Grid */}
          {filteredAchievements.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No achievements found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters to see more achievements.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    status={achievement.status}
                    unlockedAt={achievement.unlockedAt}
                    tier={tier}
                    onUpgradeClick={tier === 'free' ? handleUpgradeClick : undefined}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ContentCard>
      </PageContainer>
    </PageLayout>
  )
}
