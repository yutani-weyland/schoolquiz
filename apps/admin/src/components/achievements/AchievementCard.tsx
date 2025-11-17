'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Sparkles, Calendar } from 'lucide-react'
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
    appearance?: {
      backgroundImage?: string
      backgroundColor?: string
      [key: string]: any
    }
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
  
  // Get appearance config
  const appearance = achievement.appearance || {}
  const titleFontFamily = appearance.titleFontFamily || 'system-ui'
  const bodyFontFamily = appearance.bodyFontFamily || 'system-ui'
  const titleLetterSpacing = appearance.titleLetterSpacing || 0
  const titleCase = appearance.titleCase || 'normal'
  
  // Apply text case transformation
  const getTitleText = (text: string) => {
    switch (titleCase) {
      case 'upper':
        return text.toUpperCase()
      case 'title':
        return text.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        )
      default:
        return text
    }
  }
  
  // Check if this is the Hail Caesar achievement for Roman marble theme
  const isHailCaesar = achievement.slug === "hail-caesar" || achievement.name === "HAIL, CAESAR!" || achievement.name === "Hail Caesar"
  
  // Check if this is the Blitzkrieg achievement for army camo theme
  const isBlitzkrieg = achievement.slug === "blitzkrieg" || achievement.name === "Blitzkrieg!" || achievement.name === "Blitzkrieg" || achievement.name === "BLITZKRIEG"
  
  // Check if this is the Doppelganger achievement for Spiderman theme
  const isDoppelganger = achievement.slug === "doppelganger" || achievement.name === "Doppelganger"
  
  // Check if this is the 95.5 ATAR achievement for NESA theme
  const isATAR = achievement.slug === "master-mind" || achievement.name === "95.5 ATAR" || achievement.name === "95.5 ATAR"
  
  // Check if this is the All Rounder achievement (same style as ATAR)
  const isAllRounder = achievement.slug === "all-rounder" || achievement.name === "All Rounder"
  
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
      animate={{ opacity: (isUnlocked || isInProgress) ? 1 : 0.5, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
             className="relative w-full aspect-[3/4] max-w-[200px] sm:max-w-[200px] mx-auto group [perspective:2000px] overflow-hidden rounded-2xl"
             style={{ 
               maxWidth: 'clamp(120px, 25vw, 200px)',
               width: '100%',
               zIndex: isUnlocked ? 100 : isInProgress ? 50 : 1
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
            isHailCaesar ? "border-gray-300/60" : isBlitzkrieg ? "border-amber-900/60" : isDoppelganger ? "border-blue-600/70" : (isATAR || isAllRounder) ? "border-blue-800/70" : (isFoil || isFoilGold || isFoilSilver) ? "border-white/60" : style.border,
            "transition-all duration-700",
            isFlipped ? "opacity-0" : "opacity-100",
            (isUnlocked || isInProgress) && "cursor-pointer",
            (isFoil || isFoilGold || isFoilSilver) && !isHailCaesar && !isBlitzkrieg && !isDoppelganger && !isATAR && !isAllRounder && "foil-card"
          )}
          style={{
            backgroundColor: isHailCaesar ? '#F5F5F0' : isBlitzkrieg ? '#4A5D23' : isDoppelganger ? '#1E3A8A' : (isATAR || isAllRounder) ? '#003366' : (achievement.appearance?.backgroundColor || style.bgColor), // White marble for Hail Caesar, camo green for Blitzkrieg, Spiderman blue for Doppelganger, NESA navy for ATAR and All Rounder
            backgroundImage: isHailCaesar ? 'url(/achievements/roman-marble-texture.png)' : (isBlitzkrieg || isDoppelganger || isATAR || isAllRounder) ? 'none' : (achievement.appearance?.backgroundImage ? `url(${achievement.appearance.backgroundImage})` : undefined),
            backgroundSize: isHailCaesar ? 'cover' : (achievement.appearance?.backgroundImage ? 'cover' : undefined),
            backgroundPosition: isHailCaesar ? 'center' : (achievement.appearance?.backgroundImage ? 'center' : undefined),
            backgroundBlendMode: isHailCaesar ? 'overlay' : undefined,
            boxShadow: isUnlocked 
              ? (isHailCaesar
                ? '0 10px 40px -5px rgba(0, 0, 0, 0.2), 0 0 30px rgba(200, 200, 200, 0.3), inset 0 0 60px rgba(255, 255, 255, 0.2)'
                : isBlitzkrieg
                ? '0 10px 40px -5px rgba(0, 0, 0, 0.5), 0 0 30px rgba(74, 93, 35, 0.4), inset 0 0 60px rgba(0, 0, 0, 0.2)'
                : isDoppelganger
                ? '0 10px 40px -5px rgba(30, 58, 138, 0.5), 0 0 30px rgba(220, 38, 38, 0.4), inset 0 0 60px rgba(220, 38, 38, 0.1)'
                : (isATAR || isAllRounder)
                ? '0 10px 40px -5px rgba(0, 51, 102, 0.4)'
                : isFoil 
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
          {/* NESA Simple Blue Background for 95.5 ATAR and All Rounder */}
          {(isATAR || isAllRounder) && (
            <>
              {/* Simple solid NESA navy blue background */}
              <div 
                className="absolute inset-0 z-0"
                style={{
                  backgroundColor: '#003366',
                  background: 'none',
                  backgroundImage: 'none',
                }}
              />
            </>
          )}
          
          {/* Spiderman Red and Blue Background for Doppelganger */}
          {/* Spiderman Red and Blue Background for Doppelganger */}
          {isDoppelganger && (
            <>
              {/* Base Spiderman blue background */}
              <div 
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, #1E3A8A 0%, #1E40AF 25%, #2563EB 50%, #3B82F6 75%, #1E3A8A 100%)`,
                }}
              />
              {/* Spiderman red web pattern overlay */}
              <div 
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(220, 38, 38, 0.3) 20px, rgba(220, 38, 38, 0.3) 22px),
                    repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(220, 38, 38, 0.2) 20px, rgba(220, 38, 38, 0.2) 22px),
                    repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(220, 38, 38, 0.15) 30px, rgba(220, 38, 38, 0.15) 32px),
                    repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(220, 38, 38, 0.15) 30px, rgba(220, 38, 38, 0.15) 32px)
                  `,
                  backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 100%',
                }}
              />
              {/* Red gradient accents */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: `radial-gradient(circle at 20% 30%, rgba(220, 38, 38, 0.4) 0%, transparent 40%),
                               radial-gradient(circle at 80% 70%, rgba(220, 38, 38, 0.3) 0%, transparent 35%),
                               radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.2) 0%, transparent 50%)`,
                }}
              />
            </>
          )}
          
          {/* Army Camo Background for Blitzkrieg */}
          {isBlitzkrieg && (
            <>
              {/* Base camo colors */}
              <div 
                className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(circle at 20% 30%, #4A5D23 0%, transparent 25%),
                    radial-gradient(circle at 80% 70%, #5D6B2A 0%, transparent 25%),
                    radial-gradient(circle at 40% 80%, #3D4A1A 0%, transparent 20%),
                    radial-gradient(circle at 60% 20%, #55682F 0%, transparent 22%),
                    radial-gradient(circle at 15% 60%, #4A5D23 0%, transparent 18%),
                    linear-gradient(135deg, #4A5D23 0%, #5D6B2A 50%, #3D4A1A 100%)
                  `,
                }}
              />
              {/* Camo pattern overlay */}
              <div 
                className="absolute inset-0 opacity-60"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(93, 107, 42, 0.5) 10px, rgba(93, 107, 42, 0.5) 20px),
                    repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(61, 74, 26, 0.4) 8px, rgba(61, 74, 26, 0.4) 16px),
                    repeating-linear-gradient(90deg, transparent, transparent 12px, rgba(85, 104, 47, 0.3) 12px, rgba(85, 104, 47, 0.3) 24px)
                  `,
                  backgroundSize: '40px 40px, 30px 30px, 50px 50px',
                }}
              />
              {/* Texture overlay */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </>
          )}
          
          {/* Roman Marble Overlay for Hail Caesar */}
          {isHailCaesar && (
            <>
              <div 
                className="absolute inset-0 opacity-40"
                style={{
                  background: `linear-gradient(135deg, 
                    rgba(245, 245, 240, 0.9) 0%, 
                    rgba(230, 230, 225, 0.95) 25%, 
                    rgba(245, 245, 240, 0.9) 50%, 
                    rgba(235, 235, 230, 0.95) 75%, 
                    rgba(245, 245, 240, 0.9) 100%)`,
                }}
              />
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 0, 0, 0.05) 2px,
                    rgba(0, 0, 0, 0.05) 4px
                  )`,
                  backgroundSize: '8px 8px',
                }}
              />
            </>
          )}
          
          {/* Foil Background Effect */}
          {isFoil && !isHailCaesar && (
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
          
          {/* In Progress - no overlay, show at full opacity */}

          {/* Premium Badge */}
          {achievement.isPremiumOnly && isUnlocked && (
            <div className="absolute top-3 right-3 z-20">
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-1.5 shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          )}

          {/* Card Content */}
          <div className="flex-1 flex flex-col p-3 sm:p-4 relative z-0 h-full min-h-0">
            {/* Content above date - vertically centered for Blitzkrieg */}
            <div className={cn(
              "flex flex-col",
              isBlitzkrieg ? "flex-1 justify-center" : "flex-none"
            )}>
              {/* Icon Section */}
              <div className={cn(
                "flex items-center justify-center",
                (isHailCaesar || isBlitzkrieg || isDoppelganger) ? "flex-none mb-3" : "flex-1 mb-3"
              )}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className={cn(
                    (isHailCaesar || isBlitzkrieg || isDoppelganger) ? "min-h-0 relative" : "w-20 h-20 sm:w-24 sm:h-24",
                    isHailCaesar ? "bg-transparent" : isBlitzkrieg ? "bg-transparent" : isDoppelganger ? "bg-transparent" : style.iconBg,
                    isHailCaesar ? "rounded-none" : isBlitzkrieg ? "rounded-none" : isDoppelganger ? "rounded-none" : "rounded-xl",
                    !isHailCaesar && !isBlitzkrieg && !isDoppelganger && "backdrop-blur-sm",
                    (isHailCaesar || isBlitzkrieg || isDoppelganger) ? "" : "border-2 border-white/30",
                    "flex items-center justify-center",
                    (isHailCaesar || isBlitzkrieg || isDoppelganger) ? "" : "shadow-lg",
                    (isHailCaesar || isBlitzkrieg || isDoppelganger) ? "" : "overflow-hidden"
                  )}
                  style={(isHailCaesar || isBlitzkrieg || isDoppelganger) ? { width: 'auto', height: 'auto', maxHeight: isBlitzkrieg ? '100px' : isDoppelganger ? '110px' : '110px', maxWidth: '100%' } : undefined}
                >
                  {achievement.iconKey && (achievement.iconKey.startsWith('http') || achievement.iconKey.startsWith('/') || achievement.iconKey.includes('.')) ? (
                    <>
                      <img 
                        src={achievement.iconKey} 
                        alt={achievement.name}
                        className={cn(
                          (isHailCaesar || isBlitzkrieg || isDoppelganger) ? "object-contain" : "w-full h-full object-contain",
                          isHailCaesar ? "h-auto max-h-[110px] sm:max-h-[120px] w-auto" : isBlitzkrieg ? "h-auto max-h-[100px] sm:max-h-[110px] w-auto" : isDoppelganger ? "h-auto max-h-[110px] sm:max-h-[120px] w-auto" : "p-2"
                        )}
                        style={(isHailCaesar || isBlitzkrieg || isDoppelganger) ? { 
                          height: 'auto',
                          width: 'auto',
                          maxHeight: isBlitzkrieg ? '100px' : isDoppelganger ? '110px' : '110px',
                          maxWidth: '100%',
                          filter: isBlitzkrieg ? 'sepia(25%) contrast(115%) brightness(0.85) saturate(75%)' : undefined,
                        } : undefined}
                      />
                      {/* Army-style overlay filter for Blitzkrieg image */}
                      {isBlitzkrieg && (
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'linear-gradient(135deg, rgba(74, 93, 35, 0.2) 0%, rgba(61, 74, 26, 0.25) 50%, rgba(85, 104, 47, 0.2) 100%)',
                            mixBlendMode: 'multiply',
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <span className={cn(
                      (isHailCaesar || isBlitzkrieg || isDoppelganger) ? "text-4xl sm:text-5xl" : "text-4xl sm:text-5xl"
                    )} role="img" aria-label={achievement.name}>
                      {icon}
                    </span>
                  )}
                </motion.div>
              </div>

              {/* Title */}
              <h3 className={cn(
                "font-bold mb-2 text-center",
                isHailCaesar ? "text-gray-900 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] font-bluu-next tracking-wide text-xl" : isBlitzkrieg ? "text-amber-400 font-black tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8),0_0_8px_rgba(255,165,0,0.5)] text-xl sm:text-2xl font-germania" : isDoppelganger ? "text-white font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8),0_0_8px_rgba(220,38,38,0.6)] text-sm sm:text-base font-backissues uppercase" : (isATAR || isAllRounder) ? "text-white font-public-sans tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-lg sm:text-xl" : "text-base",
                "line-clamp-2 leading-tight",
                "transition-all duration-500 ease-out",
                "group-hover:translate-y-[-4px]",
                !isHailCaesar && !isBlitzkrieg && !isDoppelganger && !isATAR && !isAllRounder && style.text
              )}
              style={{
                ...(isBlitzkrieg ? {
                  letterSpacing: '0.05em',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(255,165,0,0.6), 0 0 20px rgba(255,140,0,0.4)',
                } : isDoppelganger ? {
                  letterSpacing: '0.08em',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(220,38,38,0.6), 0 0 20px rgba(239,68,68,0.4)',
                } : (isATAR || isAllRounder) ? {
                  letterSpacing: '0.05em',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                } : {
                  fontFamily: titleFontFamily,
                  letterSpacing: `${titleLetterSpacing}px`,
                }),
              }}
              >
                {!isHailCaesar && !isBlitzkrieg && !isDoppelganger && !isATAR && !isAllRounder 
                  ? getTitleText(achievement.name)
                  : achievement.name}
              </h3>

              {/* Brief Description Preview */}
              <p className={cn(
                "text-xs text-center",
                isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-public-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
                isHailCaesar ? "opacity-95" : (isBlitzkrieg || isDoppelganger || isATAR || isAllRounder) ? "opacity-100" : "opacity-90",
                "line-clamp-2 leading-tight",
                "transition-all duration-500 ease-out delay-75",
                "group-hover:translate-y-[-4px]",
                "tracking-wide",
                isBlitzkrieg ? "mb-0" : "mb-3"
              )}
              style={{
                ...(isBlitzkrieg ? {
                  textShadow: '1px 1px 2px rgba(0,0,0,0.9), 0 0 6px rgba(255,165,0,0.5)',
                } : isDoppelganger ? {
                  textShadow: '1px 1px 2px rgba(0,0,0,0.9), 0 0 6px rgba(220,38,38,0.5)',
                } : (isATAR || isAllRounder) ? {
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                } : {
                  fontFamily: bodyFontFamily,
                }),
              }}
              >
                {achievement.shortDescription}
              </p>
            </div>

            {/* Footer */}
            <div className={cn("space-y-2", isBlitzkrieg ? "mt-auto" : "mt-auto")}>
              {/* Progress Bar - Show for in-progress achievements */}
              {isInProgress && progressMax && (
                <div className="space-y-1 relative z-20">
                  <div className={cn(
                    "w-full h-1.5 rounded-full overflow-hidden",
                    isHailCaesar ? "bg-gray-300/40 backdrop-blur-sm" : isBlitzkrieg ? "bg-amber-900/40 backdrop-blur-sm" : isDoppelganger ? "bg-red-900/40 backdrop-blur-sm" : (isATAR || isAllRounder) ? "bg-blue-900/40 backdrop-blur-sm" : "bg-white/20 backdrop-blur-sm"
                  )}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={cn(
                        "h-full rounded-full",
                        isHailCaesar ? "bg-gray-700/80 backdrop-blur-sm" : isBlitzkrieg ? "bg-amber-400/90 backdrop-blur-sm" : isDoppelganger ? "bg-red-500/90 backdrop-blur-sm" : (isATAR || isAllRounder) ? "bg-blue-400/90 backdrop-blur-sm" : "bg-white/80 backdrop-blur-sm",
                        "shadow-sm"
                      )}
                    />
                  </div>
                  <div className={cn(
                    "flex items-center justify-between text-xs",
                        isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-public-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
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
                      isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-public-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
                      "opacity-90"
                    )}>
                      <Calendar className={cn("w-3 h-3", isHailCaesar ? "text-gray-800" : isBlitzkrieg ? "text-amber-300" : isDoppelganger ? "text-red-200" : (isATAR || isAllRounder) ? "text-white" : style.text)} />
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
            isHailCaesar ? "border-gray-300/60" : isBlitzkrieg ? "border-amber-900/60" : isDoppelganger ? "border-blue-600/70" : (isATAR || isAllRounder) ? "border-blue-800/70" : (isFoil || isFoilGold || isFoilSilver) ? "border-white/60" : style.border,
            "flex flex-col items-center justify-center",
              "transition-all duration-700",
              !isFlipped ? "opacity-0" : "opacity-100",
              (isFoil || isFoilGold || isFoilSilver) && !isHailCaesar && !isBlitzkrieg && !isDoppelganger && !isATAR && !isAllRounder && "foil-card"
            )}
          style={{
            backgroundColor: isHailCaesar ? '#F5F5F0' : isBlitzkrieg ? '#4A5D23' : isDoppelganger ? '#1E3A8A' : (isATAR || isAllRounder) ? '#003366' : style.bgColor, // White marble for Hail Caesar, camo green for Blitzkrieg, Spiderman blue for Doppelganger, NESA navy for ATAR and All Rounder
            backgroundImage: isHailCaesar ? 'url(/achievements/roman-marble-texture.png)' : (isBlitzkrieg || isDoppelganger || isATAR || isAllRounder) ? 'none' : undefined,
            backgroundSize: isHailCaesar ? 'cover' : undefined,
            backgroundPosition: isHailCaesar ? 'center' : undefined,
            backgroundBlendMode: isHailCaesar ? 'overlay' : undefined,
            boxShadow: isHailCaesar
              ? '0 10px 40px -5px rgba(0, 0, 0, 0.2), 0 0 30px rgba(200, 200, 200, 0.3), inset 0 0 60px rgba(255, 255, 255, 0.2)'
              : isBlitzkrieg
              ? '0 10px 40px -5px rgba(0, 0, 0, 0.5), 0 0 30px rgba(74, 93, 35, 0.4), inset 0 0 60px rgba(0, 0, 0, 0.2)'
              : isDoppelganger
              ? '0 10px 40px -5px rgba(30, 58, 138, 0.5), 0 0 30px rgba(220, 38, 38, 0.4), inset 0 0 60px rgba(220, 38, 38, 0.1)'
              : (isATAR || isAllRounder)
              ? '0 10px 40px -5px rgba(0, 51, 102, 0.4)'
              : isFoil 
              ? '0 10px 40px -5px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 215, 0, 0.2)' 
              : isFoilGold
              ? '0 10px 40px -5px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 165, 0, 0.3)'
              : isFoilSilver
              ? '0 10px 40px -5px rgba(192, 192, 192, 0.4), 0 0 60px rgba(255, 255, 255, 0.2)'
              : `0 10px 30px -5px ${style.glowColor}`,
          }}
          >
            {/* NESA Simple Blue Background for 95.5 ATAR and All Rounder - Back */}
            {(isATAR || isAllRounder) && (
              <>
                {/* Simple solid NESA navy blue background */}
                <div 
                  className="absolute inset-0 z-0"
                  style={{
                    backgroundColor: '#003366',
                    background: 'none',
                    backgroundImage: 'none',
                  }}
                />
              </>
            )}
            
            {/* Spiderman Red and Blue Background for Doppelganger - Back */}
            {isDoppelganger && (
              <>
                {/* Base Spiderman blue background */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, #1E3A8A 0%, #1E40AF 25%, #2563EB 50%, #3B82F6 75%, #1E3A8A 100%)`,
                  }}
                />
                {/* Spiderman red web pattern overlay */}
                <div 
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(220, 38, 38, 0.3) 20px, rgba(220, 38, 38, 0.3) 22px),
                      repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(220, 38, 38, 0.2) 20px, rgba(220, 38, 38, 0.2) 22px),
                      repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(220, 38, 38, 0.15) 30px, rgba(220, 38, 38, 0.15) 32px),
                      repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(220, 38, 38, 0.15) 30px, rgba(220, 38, 38, 0.15) 32px)
                    `,
                    backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 100%',
                  }}
                />
                {/* Red gradient accents */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `radial-gradient(circle at 20% 30%, rgba(220, 38, 38, 0.4) 0%, transparent 40%),
                                 radial-gradient(circle at 80% 70%, rgba(220, 38, 38, 0.3) 0%, transparent 35%),
                                 radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.2) 0%, transparent 50%)`,
                  }}
                />
              </>
            )}
            
            {/* Army Camo Background for Blitzkrieg - Back */}
            {isBlitzkrieg && (
              <>
                {/* Base camo colors */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: `
                      radial-gradient(circle at 20% 30%, #4A5D23 0%, transparent 25%),
                      radial-gradient(circle at 80% 70%, #5D6B2A 0%, transparent 25%),
                      radial-gradient(circle at 40% 80%, #3D4A1A 0%, transparent 20%),
                      radial-gradient(circle at 60% 20%, #55682F 0%, transparent 22%),
                      radial-gradient(circle at 15% 60%, #4A5D23 0%, transparent 18%),
                      linear-gradient(135deg, #4A5D23 0%, #5D6B2A 50%, #3D4A1A 100%)
                    `,
                  }}
                />
                {/* Camo pattern overlay */}
                <div 
                  className="absolute inset-0 opacity-60"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(93, 107, 42, 0.5) 10px, rgba(93, 107, 42, 0.5) 20px),
                      repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(61, 74, 26, 0.4) 8px, rgba(61, 74, 26, 0.4) 16px),
                      repeating-linear-gradient(90deg, transparent, transparent 12px, rgba(85, 104, 47, 0.3) 12px, rgba(85, 104, 47, 0.3) 24px)
                    `,
                    backgroundSize: '40px 40px, 30px 30px, 50px 50px',
                  }}
                />
                {/* Texture overlay */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
              </>
            )}
            
            {/* Roman Marble Overlay for Hail Caesar - Back */}
            {isHailCaesar && (
              <>
                <div 
                  className="absolute inset-0 opacity-40"
                  style={{
                    background: `linear-gradient(135deg, 
                      rgba(245, 245, 240, 0.9) 0%, 
                      rgba(230, 230, 225, 0.95) 25%, 
                      rgba(245, 245, 240, 0.9) 50%, 
                      rgba(235, 235, 230, 0.95) 75%, 
                      rgba(245, 245, 240, 0.9) 100%)`,
                  }}
                />
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 2px,
                      rgba(0, 0, 0, 0.05) 2px,
                      rgba(0, 0, 0, 0.05) 4px
                    )`,
                    backgroundSize: '8px 8px',
                  }}
                />
              </>
            )}
            
            {/* Card Variant Effects on Back */}
            {isFoil && !isHailCaesar && (
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

            {isFullArt && !isATAR && !isAllRounder && (
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

            <div className="w-full space-y-4 relative z-0 text-center">
              {/* Title */}
              <div className="space-y-2">
                <h3 className={cn(
                  "font-bold",
                  isHailCaesar ? "text-gray-900 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] font-bluu-next tracking-wide text-2xl uppercase" : isBlitzkrieg ? "text-amber-400 font-black tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8),0_0_8px_rgba(255,165,0,0.5)] text-xl sm:text-2xl font-germania" : isDoppelganger ? "text-white font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8),0_0_8px_rgba(220,38,38,0.6)] text-base sm:text-lg font-backissues uppercase" : (isATAR || isAllRounder) ? "text-white font-public-sans tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-xl sm:text-2xl" : "text-lg",
                  "leading-tight",
                  !isHailCaesar && !isBlitzkrieg && !isDoppelganger && !isATAR && !isAllRounder && style.text
                )}
                style={{
                  ...(isBlitzkrieg ? {
                    letterSpacing: '0.05em',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(255,165,0,0.6), 0 0 20px rgba(255,140,0,0.4)',
                  } : isDoppelganger ? {
                    letterSpacing: '0.08em',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(220,38,38,0.6), 0 0 20px rgba(239,68,68,0.4)',
                  } : (isATAR || isAllRounder) ? {
                    letterSpacing: '0.05em',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  } : {
                    fontFamily: titleFontFamily,
                    letterSpacing: `${titleLetterSpacing}px`,
                  }),
                }}
                >
                  {!isHailCaesar && !isBlitzkrieg && !isDoppelganger && !isATAR && !isAllRounder 
                    ? getTitleText(achievement.name)
                    : achievement.name}
                </h3>
                <p className={cn(
                  "text-sm",
                  isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-public-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
                  "opacity-90",
                  "leading-relaxed",
                  "line-clamp-4",
                  "tracking-wide"
                )}
                style={{
                  ...(isBlitzkrieg ? {
                    textShadow: '1px 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(255,165,0,0.5)',
                  } : isDoppelganger ? {
                    textShadow: '1px 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(220,38,38,0.5)',
                  } : (isATAR || isAllRounder) ? {
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  } : {
                    fontFamily: bodyFontFamily,
                  }),
                }}
                >
                  {achievement.longDescription || achievement.shortDescription}
                </p>
              </div>

              {/* Progress Bar on Back - Show for in-progress achievements */}
              {isInProgress && progressMax && (
                <div className="space-y-1.5 pt-1">
                  <div className={cn(
                    "w-full h-2 rounded-full overflow-hidden",
                    isHailCaesar ? "bg-gray-300/40 backdrop-blur-sm" : isBlitzkrieg ? "bg-amber-900/40 backdrop-blur-sm" : isDoppelganger ? "bg-red-900/40 backdrop-blur-sm" : (isATAR || isAllRounder) ? "bg-blue-900/40 backdrop-blur-sm" : "bg-white/20 backdrop-blur-sm"
                  )}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={cn(
                        "h-full rounded-full",
                        isHailCaesar ? "bg-gray-700/80 backdrop-blur-sm" : isBlitzkrieg ? "bg-amber-400/90 backdrop-blur-sm" : isDoppelganger ? "bg-red-500/90 backdrop-blur-sm" : (isATAR || isAllRounder) ? "bg-blue-400/90 backdrop-blur-sm" : "bg-white/80 backdrop-blur-sm",
                        "shadow-sm"
                      )}
                    />
                  </div>
                  <div className={cn(
                    "flex items-center justify-center gap-2 text-sm",
                    isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-public-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
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
              <div className="space-y-3 pt-2">
                {/* Unlocked Date */}
                {unlockedAt && (
                  <div className={cn(
                    "flex items-center justify-center gap-2 text-sm",
                    isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-public-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
                    "opacity-90"
                  )}>
                    <Calendar className={cn("w-4 h-4", isHailCaesar ? "text-gray-800" : isBlitzkrieg ? "text-amber-300" : isDoppelganger ? "text-red-200" : (isATAR || isAllRounder) ? "text-white" : style.text)} />
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
                    "flex items-center justify-center gap-2 text-sm",
                    isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-public-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
                    "opacity-90"
                  )}>
                    <span className="font-medium">Quiz:</span>
                    <span>{quizSlug}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

