'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Filter, Calendar, ChevronDown } from 'lucide-react'
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
  progressValue?: number
  progressMax?: number
}

interface AchievementBrowserModalProps {
  isOpen: boolean
  onClose: () => void
  achievements: Achievement[]
  tier: UserTier
}

type FilterType = 'all' | 'unlocked' | 'in-progress' | 'locked'

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
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [rarityFilter, setRarityFilter] = useState<string>('all')
  const [dateSort, setDateSort] = useState<'newest' | 'oldest' | 'rarity'>('newest')
  const [showHidden, setShowHidden] = useState(false)

  // Reset filters when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setStatusFilter('all')
      setCategoryFilter('all')
      setRarityFilter('all')
      setDateSort('newest')
      setShowHidden(false)
    }
  }, [isOpen])

  // Get unique categories and rarities
  const categories = useMemo(() => Array.from(new Set(achievements.map(a => a.category))), [achievements])
  const rarities = useMemo(() => Array.from(new Set(achievements.map(a => a.rarity))), [achievements])

  // Filter and sort achievements
  const filteredAndSortedAchievements = useMemo(() => {
    let filtered = achievements.filter((achievement) => {
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
      if (statusFilter === 'in-progress' && (achievement.status === 'unlocked' || !achievement.progressValue || achievement.progressValue === 0)) return false
      if (statusFilter === 'locked' && (achievement.status === 'unlocked' || (achievement.progressValue && achievement.progressValue > 0))) return false

      // Category filter
      if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false

      // Rarity filter
      if (rarityFilter !== 'all' && achievement.rarity !== rarityFilter) return false

      // Hidden filter
      if (!showHidden && achievement.status === 'locked_premium') return false

      return true
    })

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (dateSort === 'rarity') {
        // Sort by rarity (legendary first)
        const rarityA = rarityOrder[a.rarity as keyof typeof rarityOrder] || 0
        const rarityB = rarityOrder[b.rarity as keyof typeof rarityOrder] || 0
        if (rarityB !== rarityA) return rarityB - rarityA
        // Then by unlocked status
        if (a.status === 'unlocked' && b.status !== 'unlocked') return -1
        if (a.status !== 'unlocked' && b.status === 'unlocked') return 1
        // Then alphabetically
        return a.name.localeCompare(b.name)
      } else {
        // Sort by date
        const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0
        const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0
        
        if (dateA === 0 && dateB === 0) {
          // Both have no date, sort by rarity
          const rarityA = rarityOrder[a.rarity as keyof typeof rarityOrder] || 0
          const rarityB = rarityOrder[b.rarity as keyof typeof rarityOrder] || 0
          if (rarityB !== rarityA) return rarityB - rarityA
          return a.name.localeCompare(b.name)
        }
        if (dateA === 0) return 1
        if (dateB === 0) return -1
        
        return dateSort === 'newest' ? dateB - dateA : dateA - dateB
      }
    })

    return filtered
  }, [achievements, searchQuery, statusFilter, categoryFilter, rarityFilter, dateSort, showHidden])

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
                    {filteredAndSortedAchievements.filter(a => a.status === 'unlocked').length} of {filteredAndSortedAchievements.length} shown
                    {filteredAndSortedAchievements.length !== totalCount && ` (${unlockedCount} of ${totalCount} total unlocked)`}
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

              {/* Search and Filters */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search achievements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>
                
                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter */}
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
                    {(['all', 'unlocked', 'in-progress', 'locked'] as FilterType[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-3 py-1 text-xs sm:text-sm transition-colors rounded-md ${
                          statusFilter === f
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {f === 'all' ? 'All' : f === 'unlocked' ? 'Unlocked' : f === 'in-progress' ? 'In Progress' : 'Locked'}
                      </button>
                    ))}
                  </div>

                  {/* Category Filter */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-all cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>

                  {/* Rarity Filter */}
                  <select
                    value={rarityFilter}
                    onChange={(e) => setRarityFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-all cursor-pointer"
                  >
                    <option value="all">All Rarities</option>
                    {rarities.map(rarity => (
                      <option key={rarity} value={rarity}>
                        {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                      </option>
                    ))}
                  </select>

                  {/* Sort */}
                  <button
                    onClick={() => {
                      if (dateSort === 'newest') setDateSort('oldest')
                      else if (dateSort === 'oldest') setDateSort('rarity')
                      else setDateSort('newest')
                    }}
                    className="px-3 py-1.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-1.5"
                    title={`Sort: ${dateSort === 'newest' ? 'Newest first' : dateSort === 'oldest' ? 'Oldest first' : 'By rarity'}`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {dateSort === 'newest' ? 'Newest' : dateSort === 'oldest' ? 'Oldest' : 'Rarity'}
                  </button>

                  {/* Show Hidden Toggle */}
                  <button
                    onClick={() => setShowHidden(!showHidden)}
                    className={`px-3 py-1.5 text-xs sm:text-sm border rounded-lg transition-all flex items-center gap-1.5 ${
                      showHidden
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={showHidden ? 'Hide premium locked' : 'Show premium locked'}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Hidden
                  </button>
                </div>
              </div>

              {/* Achievements Grid */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10">
                {filteredAndSortedAchievements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <p className="text-gray-600 dark:text-gray-400">
                      No achievements found
                    </p>
                    {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || rarityFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setCategoryFilter('all')
                          setStatusFilter('all')
                          setRarityFilter('all')
                        }}
                        className="mt-4 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 md:gap-10">
                    <AnimatePresence mode="popLayout">
                      {filteredAndSortedAchievements.map((achievement, index) => (
                        <motion.div
                          key={achievement.id}
                          layout
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0, 
                            scale: 1,
                          }}
                          exit={{ opacity: 0, scale: 0.8, y: -10 }}
                          transition={{ 
                            duration: 0.3, 
                            delay: index * 0.01,
                            ease: [0.22, 1, 0.36, 1],
                            layout: { duration: 0.4 }
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
                            progressValue={achievement.progressValue}
                            progressMax={achievement.progressMax}
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

