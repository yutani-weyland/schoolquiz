'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { AchievementCard } from './AchievementCard'
import type { UserTier } from '@/lib/feature-gating'

export interface Achievement {
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
  series?: string | null // Series/collection name
  cardVariant?: 'standard' | 'foil' | 'foilGold' | 'foilSilver' | 'shiny' | 'fullArt' // Special card designs
  status: 'unlocked' | 'locked_free' | 'locked_premium'
  unlockedAt?: string
  quizSlug?: string | null
}

interface AchievementBrowserModalProps {
  isOpen: boolean
  onClose: () => void
  achievements: Achievement[]
  tier: UserTier
}

type FilterType = 'all' | 'unlocked' | 'locked'

const rarityOrder = {
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
}

export function AchievementBrowserModal({
  isOpen,
  onClose,
  achievements,
  tier,
}: AchievementBrowserModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterType>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Reset filters when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setStatusFilter('all')
      setShowFilters(false)
    }
  }, [isOpen])

  // Filter achievements
  const filteredAchievements = achievements.filter((achievement) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        achievement.name.toLowerCase().includes(query) ||
        achievement.shortDescription.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter === 'unlocked' && achievement.status !== 'unlocked') return false
    if (statusFilter === 'locked' && achievement.status === 'unlocked') return false

    return true
  })

  // Sort: unlocked first, then by rarity (legendary first)
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    // Unlocked achievements first
    if (a.status === 'unlocked' && b.status !== 'unlocked') return -1
    if (a.status !== 'unlocked' && b.status === 'unlocked') return 1

    // Then by rarity
    const rarityA = rarityOrder[a.rarity as keyof typeof rarityOrder] || 0
    const rarityB = rarityOrder[b.rarity as keyof typeof rarityOrder] || 0
    if (rarityB !== rarityA) return rarityB - rarityA

    // Then alphabetically
    return a.name.localeCompare(b.name)
  })

  const unlockedCount = achievements.filter((a) => a.status === 'unlocked').length
  const totalCount = achievements.length

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 max-w-7xl w-full max-h-[90vh] flex flex-col pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    All Achievements
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {unlockedCount} of {totalCount} unlocked
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search achievements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-all"
                  />
                </div>
                
                {/* Simple Status Filter */}
                <div className="flex items-center gap-1 mt-3">
                  {(['all', 'unlocked', 'locked'] as FilterType[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-3 py-1 text-xs sm:text-sm transition-colors rounded-lg ${
                        statusFilter === f
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === 'unlocked' ? 'Unlocked' : 'Locked'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Achievements Grid */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10">
                {sortedAchievements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <p className="text-gray-600 dark:text-gray-400">
                      No achievements found
                    </p>
                  </div>
                ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 md:gap-10">
                          <AnimatePresence mode="popLayout">
                            {sortedAchievements.map((achievement, index) => (
                              <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ 
                                  opacity: 1, 
                                  y: 0, 
                                  scale: 1,
                                }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ 
                                  duration: 0.3, 
                                  delay: index * 0.01,
                                  ease: [0.22, 1, 0.36, 1]
                                }}
                                className="relative flex justify-center"
                                style={{
                                  width: '100%',
                                  maxWidth: '200px',
                                  margin: '0 auto',
                                  zIndex: achievement.status === 'unlocked' ? 100 : 1,
                                }}
                                whileHover={{ 
                                  scale: 1.08,
                                  zIndex: achievement.status === 'unlocked' ? 200 : 10,
                                  transition: { duration: 0.2 }
                                }}
                              >
                                <AchievementCard
                                  achievement={achievement}
                                  status={achievement.status}
                                  unlockedAt={achievement.unlockedAt}
                                  quizSlug={achievement.quizSlug}
                                  tier={tier}
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

