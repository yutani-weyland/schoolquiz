'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Sparkles, Calendar, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
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
    series?: string | null // Series/collection name
    cardVariant?: 'standard' | 'foil' | 'foilGold' | 'foilSilver' | 'shiny' | 'fullArt' // Special card designs
  }
  status: 'unlocked' | 'locked_free' | 'locked_premium'
  unlockedAt?: string
  quizSlug?: string | null
  percentOfPlayers?: number
  progressValue?: number
  progressMax?: number
  tier: UserTier
  onUpgradeClick?: () => void
  isFlipped?: boolean // Controlled flip state
  onFlipChange?: (flipped: boolean) => void // Callback when flip state changes
}

const rarityStyles = {
  common: {
    bgColor: '#F59E0B', // Vibrant amber/orange
    border: 'border-amber-400/80',
    glowColor: 'rgba(245, 158, 11, 0.5)', // amber-500
    text: 'text-white',
    badge: 'bg-white/40 text-white',
    iconBg: 'bg-white/50',
  },
  uncommon: {
    bgColor: '#10B981', // Emerald green - vibrant like quiz cards
    border: 'border-emerald-300/80',
    glowColor: 'rgba(16, 185, 129, 0.5)', // emerald-500
    text: 'text-white',
    badge: 'bg-white/30 text-white',
    iconBg: 'bg-white/40',
  },
  rare: {
    bgColor: '#3B82F6', // Bright blue - vibrant like quiz cards
    border: 'border-blue-300/80',
    glowColor: 'rgba(59, 130, 246, 0.5)', // blue-500
    text: 'text-white',
    badge: 'bg-white/30 text-white',
    iconBg: 'bg-white/40',
  },
  epic: {
    bgColor: '#A855F7', // Vibrant purple - like quiz cards
    border: 'border-purple-300/80',
    glowColor: 'rgba(168, 85, 247, 0.5)', // purple-500
    text: 'text-white',
    badge: 'bg-white/30 text-white',
    iconBg: 'bg-white/40',
  },
  legendary: {
    bgColor: '#F59E0B', // Golden amber - vibrant like quiz cards
    border: 'border-yellow-300/80',
    glowColor: 'rgba(245, 158, 11, 0.6)', // amber-500
    text: 'text-white',
    badge: 'bg-white/40 text-white',
    iconBg: 'bg-white/50',
  },
}

const getIcon = (iconKey: string | null | undefined, rarity: string) => {
  if (iconKey) {
    // Map icon keys to emojis if needed
    return iconKey
  }
  
  // Default icons by rarity
  const icons: Record<string, string> = {
    common: '🏆',
    uncommon: '🥈',
    rare: '🥇',
    epic: '💎',
    legendary: '👑',
  }
  
  return icons[rarity] || '🏆'
}

export function AchievementCard({
  achievement,
  status,
  unlockedAt,
  quizSlug,
  percentOfPlayers,
  progressValue,
  progressMax,
  tier,
  onUpgradeClick,
  isFlipped: controlledIsFlipped,
  onFlipChange,
}: AchievementCardProps) {
  const style = rarityStyles[achievement.rarity as keyof typeof rarityStyles] || rarityStyles.common
  const isUnlocked = status === 'unlocked'
  const isLockedPremium = status === 'locked_premium'
  const icon = getIcon(achievement.iconKey, achievement.rarity)
  const [internalIsFlipped, setInternalIsFlipped] = useState(false)
  
  // Use controlled flip state if provided, otherwise use internal state
  const isFlipped = controlledIsFlipped !== undefined ? controlledIsFlipped : internalIsFlipped
  
  const handleFlipChange = (flipped: boolean) => {
    if (controlledIsFlipped === undefined) {
      setInternalIsFlipped(flipped)
    }
    onFlipChange?.(flipped)
  }
  
  const cardVariant = achievement.cardVariant || 'standard'
  const isFoil = cardVariant === 'foil'
  const isFoilGold = cardVariant === 'foilGold'
  const isFoilSilver = cardVariant === 'foilSilver'
  const isShiny = cardVariant === 'shiny'
  const isFullArt = cardVariant === 'fullArt'
  
  // Check if achievement is in progress (has progress but not unlocked)
  const isInProgress = !isUnlocked && progressValue !== undefined && progressMax !== undefined && progressValue > 0
  const progressPercent = isInProgress && progressMax ? Math.min((progressValue / progressMax) * 100, 100) : 0

  const handleClick = () => {
    if (isLockedPremium && onUpgradeClick) {
      onUpgradeClick()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: isUnlocked ? 1 : 0.5, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
             className="relative w-full aspect-[3/4] max-w-[200px] sm:max-w-[200px] mx-auto group [perspective:2000px] overflow-hidden rounded-2xl"
             style={{ 
               maxWidth: 'clamp(120px, 25vw, 200px)',
               width: '100%'
             }}
          onMouseEnter={() => (isUnlocked || isInProgress) && handleFlipChange(true)}
          onMouseLeave={() => handleFlipChange(false)}
      whileHover={isUnlocked ? { 
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      } : {}}
    >
      {/* Card Container */}
      <div
        className={cn(
          "relative w-full h-full",
          "[transform-style:preserve-3d]",
          "transition-all duration-700 ease-out",
            isFlipped && (isUnlocked || isInProgress)
            ? "[transform:rotateY(180deg)]"
            : "[transform:rotateY(0deg)]"
        )}
      >
        {/* Front of Card */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full",
            "[backface-visibility:hidden] [transform:rotateY(0deg)]",
            "overflow-hidden rounded-2xl",
            "border-2",
            (isFoil || isFoilGold || isFoilSilver) ? "border-white/60" : style.border,
            "transition-all duration-700",
            isFlipped ? "opacity-0" : "opacity-100",
            (isUnlocked || isInProgress) && "cursor-pointer",
            (isFoil || isFoilGold || isFoilSilver) && "foil-card"
          )}
          style={{
            backgroundColor: style.bgColor, // Always use solid opaque background
            boxShadow: isUnlocked 
              ? (isFoil 
                ? '0 10px 40px -5px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 215, 0, 0.2)' 
                : isFoilGold
                ? '0 10px 40px -5px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 165, 0, 0.3)'
                : isFoilSilver
                ? '0 10px 40px -5px rgba(192, 192, 192, 0.4), 0 0 60px rgba(255, 255, 255, 0.2)'
                : `0 10px 30px -5px ${style.glowColor}`)
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          onClick={handleClick}
        >
          {/* Foil Background Effect */}
          {isFoil && (
            <>
              <div 
                className="absolute inset-0 foil-gradient opacity-100"
                style={{
                  background: `linear-gradient(135deg, 
                    ${style.bgColor} 0%, 
                    rgba(255, 215, 0, 0.6) 25%, 
                    rgba(255, 20, 147, 0.6) 50%, 
                    rgba(0, 191, 255, 0.6) 75%, 
                    ${style.bgColor} 100%)`,
                }}
              />
              {/* Animated foil shimmer */}
              <motion.div
                className="absolute inset-0 foil-shimmer"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'linear',
                }}
                style={{
                  background: `linear-gradient(
                    45deg,
                    transparent 30%,
                    rgba(255, 255, 255, 0.5) 50%,
                    transparent 70%
                  )`,
                  backgroundSize: '200% 200%',
                }}
              />
              {/* Holographic pattern overlay */}
              <div 
                className="absolute inset-0 opacity-30 overflow-hidden rounded-2xl"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(255, 255, 255, 0.1) 10px,
                    rgba(255, 255, 255, 0.1) 20px
                  )`,
                  backgroundSize: '28.28px 28.28px',
                  backgroundPosition: '0 0',
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 2%, black 98%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 2%, black 98%, transparent 100%)',
                }}
              />
            </>
          )}
          {/* Locked Overlay - only show if not in progress */}
          {!isUnlocked && !isInProgress && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
              <div className="bg-black/60 rounded-full p-3 shadow-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
          
          {/* In Progress Overlay - subtle overlay that doesn't block content */}
          {isInProgress && (
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-10 rounded-2xl pointer-events-none" />
          )}

          {/* Premium Badge */}
          {achievement.isPremiumOnly && isUnlocked && (
            <div className="absolute top-3 right-3 z-20">
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-1.5 shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          )}

          {/* Locked Overlay - only show if not in progress */}
          {!isUnlocked && !isInProgress && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
              <div className="bg-black/60 rounded-full p-3 shadow-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
          
          {/* In Progress Overlay - subtle overlay that doesn't block content */}
          {isInProgress && (
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-10 rounded-2xl pointer-events-none" />
          )}

          {/* Premium Badge */}
          {achievement.isPremiumOnly && isUnlocked && (
            <div className="absolute top-3 right-3 z-20">
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-1.5 shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          )}

          {/* Card Content */}
          <div className="flex-1 flex flex-col p-4 relative z-0 h-full">
            {/* Icon Section */}
            <div className="flex-1 flex items-center justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className={cn(
                  "w-16 h-16 rounded-xl",
                  style.iconBg,
                  "backdrop-blur-sm",
                  "border-2 border-white/30",
                  "flex items-center justify-center",
                  "shadow-lg"
                )}
              >
                <span className="text-3xl" role="img" aria-label={achievement.name}>
                  {icon}
                </span>
              </motion.div>
            </div>

            {/* Title */}
            <h3 className={cn(
              "font-bold text-base mb-2 text-center",
              style.text,
              "line-clamp-2 leading-tight",
              "transition-all duration-500 ease-out",
              "group-hover:translate-y-[-4px]"
            )}>
              {achievement.name}
            </h3>

            {/* Description Preview */}
            <p className={cn(
              "text-sm text-center mb-3",
              style.text,
              "opacity-90",
              "line-clamp-2 leading-relaxed",
              "flex-1",
              "transition-all duration-500 ease-out delay-75",
              "group-hover:translate-y-[-4px]"
            )}>
              {achievement.shortDescription}
            </p>

            {/* Footer */}
            <div className="mt-auto space-y-2">
              {/* Progress Bar - Show for in-progress achievements */}
              {isInProgress && progressMax && (
                <div className="space-y-1 relative z-20">
                  <div className={cn(
                    "w-full h-1.5 rounded-full overflow-hidden",
                    "bg-white/20 backdrop-blur-sm"
                  )}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={cn(
                        "h-full rounded-full",
                        "bg-white/80 backdrop-blur-sm",
                        "shadow-sm"
                      )}
                    />
                  </div>
                  <div className={cn(
                    "flex items-center justify-between text-xs",
                    style.text,
                    "opacity-90"
                  )}>
                    <span className="font-medium">
                      {progressValue} / {progressMax}
                    </span>
                    <span className="font-bold">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Unlocked Date - Show on front instead of rarity */}
              {isUnlocked && unlockedAt && (
                <div className={cn(
                  "flex items-center justify-center gap-1.5 text-xs",
                  style.text,
                  "opacity-90"
                )}>
                  <Calendar className={cn("w-3 h-3", style.text)} />
                  <span>
                    {new Date(unlockedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {/* Locked Premium Message */}
              {isLockedPremium && !isInProgress && (
                <div className="text-center">
                  <p className={cn("text-xs font-medium", style.text, "opacity-75")}>
                    Premium Only
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Shine Effect */}
          {isUnlocked && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0"
              animate={{
                x: ['-100%', '200%'],
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 5,
                ease: 'easeInOut',
              }}
              style={{ pointerEvents: 'none' }}
            />
          )}
        </div>

        {/* Back of Card */}
        {(isUnlocked || isInProgress) && (
          <div
            className={cn(
              "absolute inset-0 w-full h-full",
              "[backface-visibility:hidden] [transform:rotateY(180deg)]",
              "overflow-hidden rounded-2xl",
              "p-4",
            "border-2",
            (isFoil || isFoilGold || isFoilSilver) ? "border-white/60" : style.border,
            "flex flex-col",
              "transition-all duration-700",
              !isFlipped ? "opacity-0" : "opacity-100",
              (isFoil || isFoilGold || isFoilSilver) && "foil-card"
            )}
          style={{
            backgroundColor: style.bgColor, // Always use solid opaque background
            boxShadow: isFoil 
              ? '0 10px 40px -5px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 215, 0, 0.2)' 
              : isFoilGold
              ? '0 10px 40px -5px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 165, 0, 0.3)'
              : isFoilSilver
              ? '0 10px 40px -5px rgba(192, 192, 192, 0.4), 0 0 60px rgba(255, 255, 255, 0.2)'
              : `0 10px 30px -5px ${style.glowColor}`,
          }}
          >
            {/* Card Variant Effects on Back */}
            {isFoil && (
              <>
                <div 
                  className="absolute inset-0 foil-gradient opacity-100"
                  style={{
                    background: `linear-gradient(135deg, 
                      ${style.bgColor} 0%, 
                      rgba(255, 215, 0, 0.6) 25%, 
                      rgba(255, 20, 147, 0.6) 50%, 
                      rgba(0, 191, 255, 0.6) 75%, 
                      ${style.bgColor} 100%)`,
                  }}
                />
                <motion.div
                  className="absolute inset-0 foil-shimmer"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'linear',
                  }}
                  style={{
                    background: `linear-gradient(
                      45deg,
                      transparent 30%,
                      rgba(255, 255, 255, 0.5) 50%,
                      transparent 70%
                    )`,
                    backgroundSize: '200% 200%',
                  }}
                />
                <div 
                  className="absolute inset-0 opacity-30 overflow-hidden rounded-2xl"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 10px,
                      rgba(255, 255, 255, 0.1) 10px,
                      rgba(255, 255, 255, 0.1) 20px
                    )`,
                    backgroundSize: '28.28px 28.28px',
                    backgroundPosition: '0 0',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 2%, black 98%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 2%, black 98%, transparent 100%)',
                  }}
                />
              </>
            )}

            {isFoilGold && (
              <>
                <div 
                  className="absolute inset-0 foil-gradient opacity-100"
                  style={{
                    background: `linear-gradient(135deg, 
                      #FFD700 0%, 
                      #FFA500 25%, 
                      #FFD700 50%, 
                      #FFA500 75%, 
                      #FFD700 100%)`,
                  }}
                />
                <motion.div
                  className="absolute inset-0 foil-shimmer"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'linear',
                  }}
                  style={{
                    background: `linear-gradient(
                      45deg,
                      transparent 30%,
                      rgba(255, 255, 200, 0.6) 50%,
                      transparent 70%
                    )`,
                    backgroundSize: '200% 200%',
                  }}
                />
              </>
            )}

            {isFoilSilver && (
              <>
                <div 
                  className="absolute inset-0 foil-gradient opacity-100"
                  style={{
                    background: `linear-gradient(135deg, 
                      #C0C0C0 0%, 
                      #E8E8E8 25%, 
                      #C0C0C0 50%, 
                      #E8E8E8 75%, 
                      #C0C0C0 100%)`,
                  }}
                />
                <motion.div
                  className="absolute inset-0 foil-shimmer"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'linear',
                  }}
                  style={{
                    background: `linear-gradient(
                      45deg,
                      transparent 30%,
                      rgba(255, 255, 255, 0.7) 50%,
                      transparent 70%
                    )`,
                    backgroundSize: '200% 200%',
                  }}
                />
              </>
            )}

            {isShiny && (
              <>
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    background: [
                      `radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 50%)`,
                      `radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.4) 0%, transparent 50%)`,
                      `radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 50%)`,
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </>
            )}

            {isFullArt && (
              <>
                <div 
                  className="absolute inset-0 opacity-70"
                  style={{
                    background: `linear-gradient(
                      180deg,
                      ${style.bgColor} 0%,
                      transparent 30%,
                      transparent 70%,
                      ${style.bgColor} 100%
                    )`,
                  }}
                />
              </>
            )}

            {/* Premium Badge */}
            {achievement.isPremiumOnly && (
              <div className="absolute top-3 right-3 z-20">
                <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-1.5 shadow-lg">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
            )}

            <div className="flex-1 space-y-4 relative z-0">
              {/* Title */}
              <div className="space-y-2">
                <h3 className={cn(
                  "text-lg font-bold",
                  style.text,
                  "leading-tight"
                )}>
                  {achievement.name}
                </h3>
                <p className={cn(
                  "text-sm",
                  style.text,
                  "opacity-90",
                  "leading-relaxed",
                  "line-clamp-4"
                )}>
                  {achievement.longDescription || achievement.shortDescription}
                </p>
              </div>

              {/* Progress Bar on Back - Show for in-progress achievements */}
              {isInProgress && progressMax && (
                <div className="space-y-1.5 pt-1">
                  <div className={cn(
                    "w-full h-2 rounded-full overflow-hidden",
                    "bg-white/20 backdrop-blur-sm"
                  )}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={cn(
                        "h-full rounded-full",
                        "bg-white/80 backdrop-blur-sm",
                        "shadow-sm"
                      )}
                    />
                  </div>
                  <div className={cn(
                    "flex items-center justify-between text-sm",
                    style.text,
                    "opacity-90"
                  )}>
                    <span className="font-medium">
                      Progress: {progressValue} / {progressMax}
                    </span>
                    <span className="font-bold">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-2 pt-1.5">
                {/* Rarity Badge - Moved to back */}
                <div className="flex justify-center pb-2">
                  <span className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold",
                    style.badge,
                    "backdrop-blur-sm",
                    "capitalize",
                    "shadow-sm"
                  )}>
                    {achievement.rarity}
                  </span>
                </div>

                {/* Series */}
                {achievement.series && (
                  <div className={cn(
                    "flex items-center gap-2 text-sm",
                    style.text,
                    "opacity-90",
                    "font-semibold"
                  )}>
                    <span className="text-xs opacity-75">Series:</span>
                    <span>{achievement.series}</span>
                  </div>
                )}

                {/* Category */}
                <div className={cn(
                  "flex items-center gap-2 text-sm",
                  style.text,
                  "opacity-90"
                )}>
                  <Award className={cn("w-4 h-4", style.text)} />
                  <span className="capitalize">{achievement.category}</span>
                </div>

                {/* Unlocked Date */}
                {unlockedAt && (
                  <div className={cn(
                    "flex items-center gap-2 text-sm",
                    style.text,
                    "opacity-90"
                  )}>
                    <Calendar className={cn("w-4 h-4", style.text)} />
                    <span>
                      {new Date(unlockedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                {/* Quiz Slug */}
                {quizSlug && (
                  <div className={cn(
                    "flex items-center gap-2 text-sm",
                    style.text,
                    "opacity-90"
                  )}>
                    <span className="font-medium">Quiz:</span>
                    <span>{quizSlug}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 mt-3 border-t border-white/20">
              <div className={cn(
                "text-center",
                "px-2 py-1.5 rounded-lg",
                "transition-all duration-300",
                "bg-white/10 hover:bg-white/20",
                "cursor-pointer"
              )}>
                <span className={cn("text-sm font-medium", style.text)}>
                  {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

