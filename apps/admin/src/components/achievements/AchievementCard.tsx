'use client'

import { motion } from 'framer-motion'
import { Lock, Crown } from 'lucide-react'
import type { UserTier } from '@/lib/feature-gating'

export interface AchievementCardProps {
  achievement: {
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
  }
  status: 'unlocked' | 'locked_free' | 'locked_premium'
  unlockedAt?: string
  percentOfPlayers?: number
  progressValue?: number
  progressMax?: number
  tier: UserTier
  onUpgradeClick?: () => void
}

const rarityColors = {
  common: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-900 dark:text-gray-100',
    desc: 'text-gray-700 dark:text-gray-300',
    pill: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  },
  uncommon: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40',
    border: 'border-green-200 dark:border-green-700/50',
    text: 'text-green-900 dark:text-green-100',
    desc: 'text-green-800 dark:text-green-200',
    pill: 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300',
  },
  rare: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/40',
    border: 'border-blue-200 dark:border-blue-700/50',
    text: 'text-blue-900 dark:text-blue-100',
    desc: 'text-blue-800 dark:text-blue-200',
    pill: 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300',
  },
  epic: {
    bg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/40 dark:to-violet-900/40',
    border: 'border-purple-200 dark:border-purple-700/50',
    text: 'text-purple-900 dark:text-purple-100',
    desc: 'text-purple-800 dark:text-purple-200',
    pill: 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/40 dark:to-amber-900/40',
    border: 'border-yellow-200 dark:border-yellow-700/50',
    text: 'text-yellow-900 dark:text-yellow-100',
    desc: 'text-yellow-800 dark:text-yellow-200',
    pill: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300',
  },
}

export function AchievementCard({
  achievement,
  status,
  unlockedAt,
  percentOfPlayers,
  progressValue,
  progressMax,
  tier,
  onUpgradeClick,
}: AchievementCardProps) {
  const colors = rarityColors[achievement.rarity as keyof typeof rarityColors] || rarityColors.common
  const isUnlocked = status === 'unlocked'
  const isLockedPremium = status === 'locked_premium'

  const handleClick = () => {
    if (isLockedPremium && onUpgradeClick) {
      onUpgradeClick()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`
        relative ${colors.bg} ${colors.border} border rounded-3xl p-5 
        flex items-center gap-4 shadow-lg dark:shadow-lg overflow-hidden
        ${isUnlocked ? 'cursor-pointer' : isLockedPremium ? 'cursor-pointer' : 'cursor-default'}
        ${!isUnlocked ? 'opacity-60' : ''}
        ${isLockedPremium ? 'blur-[1px]' : ''}
      `}
      onClick={handleClick}
    >
      {/* Lock/Crown Icon */}
      {!isUnlocked && (
        <div className="absolute top-3 right-3 z-10">
          {isLockedPremium ? (
            <Crown className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
          ) : (
            <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      )}

      {/* Achievement Icon */}
      <div className="flex-shrink-0 relative z-10">
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-md transition-transform duration-200 overflow-hidden ${
            isUnlocked ? 'group-hover:scale-110' : ''
          }`}
          style={{
            backgroundColor: achievement.iconKey ? undefined : 'rgba(0, 0, 0, 0.05)',
          }}
        >
          {achievement.iconKey ? (
            <span className="text-3xl" role="img" aria-label={achievement.name}>
              🏆
            </span>
          ) : (
            <span className="text-3xl" role="img" aria-label={achievement.name}>
              🏆
            </span>
          )}
        </div>
      </div>

      {/* Achievement Info */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className={`font-semibold text-sm ${colors.text} line-clamp-1`}>
            {achievement.name}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.pill} flex-shrink-0`}>
            {achievement.rarity}
          </span>
        </div>
        <p className={`text-xs ${colors.desc} line-clamp-2 leading-tight mb-2`}>
          {achievement.shortDescription}
        </p>

        {/* Progress Bar */}
        {progressMax && progressValue !== undefined && (
          <div className="mb-2">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(progressValue / progressMax) * 100}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full ${
                  achievement.rarity === 'legendary'
                    ? 'bg-yellow-500'
                    : achievement.rarity === 'epic'
                    ? 'bg-purple-500'
                    : achievement.rarity === 'rare'
                    ? 'bg-blue-500'
                    : achievement.rarity === 'uncommon'
                    ? 'bg-green-500'
                    : 'bg-gray-500'
                }`}
              />
            </div>
            <p className={`text-xs ${colors.desc} mt-1`}>
              {progressValue} / {progressMax}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div
          className={`flex items-center justify-between text-xs ${colors.desc} pt-2 border-t ${
            achievement.rarity === 'common'
              ? 'border-gray-100 dark:border-gray-700'
              : 'border-current/20 dark:border-current/30'
          }`}
        >
          {isUnlocked && unlockedAt ? (
            <span className="truncate">
              {new Date(unlockedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          ) : isLockedPremium ? (
            <span className="truncate text-yellow-600 dark:text-yellow-400">
              Premium only
            </span>
          ) : (
            <span className="truncate">Keep playing to unlock</span>
          )}
          {percentOfPlayers !== undefined && (
            <span className={`font-semibold ml-2 ${colors.text}`}>
              {percentOfPlayers}% of players
            </span>
          )}
        </div>
      </div>

      {/* Premium Lock Overlay */}
      {isLockedPremium && (
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20 rounded-3xl pointer-events-none" />
      )}
    </motion.div>
  )
}

