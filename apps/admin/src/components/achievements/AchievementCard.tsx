'use client'

import { useState, useEffect } from 'react'
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
    cardVariant?: 'standard' | 'foil' | 'foilGold' | 'foilSilver' | 'prismatic' | 'neon' | 'shiny' | 'fullArt' // Special card designs
    appearance?: {
      backgroundImage?: string
      backgroundColor?: string
      material?: 'standard' | 'wood' | 'stone' | 'glass' | 'steel' | 'paper' | 'parchment'
      [key: string]: any
    }
  }
  status: 'unlocked' | 'locked_free' | 'locked_premium'
  unlockedAt?: string
  quizSlug?: string | null
  percentOfPlayers?: number
  progressValue?: number
  progressMax?: number
  isTracked?: boolean // For achievements earned over multiple weeks
  trackedWeeks?: number // Total weeks for tracked achievement
  trackedProgress?: number // Current week progress (e.g., 3 out of 8 weeks)
  tier: UserTier
  onUpgradeClick?: () => void
  isFlipped?: boolean // Controlled flip state
  onFlipChange?: (flipped: boolean) => void // Callback when flip state changes
  triggerEntrance?: boolean // Trigger entrance animation for testing
}

// Rarity icons - subtle indicators for each rarity
const rarityIcons: Record<string, { icon: string; label: string }> = {
  common: { icon: '', label: '' },
  uncommon: { icon: '●', label: 'Uncommon' }, // Small circle
  rare: { icon: '◆', label: 'Rare' }, // Diamond
  epic: { icon: '✦', label: 'Epic' }, // Sparkle
  legendary: { icon: '✧', label: 'Legendary' }, // Star sparkle
}

// WoW rarity colors with enhanced visual effects
const rarityStyles = {
  common: {
    bgColor: '#9D9D9D', // Gray
    border: 'border-gray-400/80',
    glowColor: 'rgba(157, 157, 157, 0.5)',
    text: 'text-white',
    badge: 'bg-white/40 text-white',
    iconBg: 'bg-white/50',
    borderStyle: 'flat', // Standard: flat border
    glowStyle: 'none',
    revealAnimation: 'simple', // Standard: simple flip
  },
  uncommon: {
    bgColor: '#1EFF00', // Green
    border: 'border-green-300/80',
    glowColor: 'rgba(30, 255, 0, 0.5)',
    text: 'text-white',
    badge: 'bg-white/30 text-white',
    iconBg: 'bg-white/40',
    borderStyle: 'silver', // Silver: subtle gradient + shine
    glowStyle: 'silver',
    revealAnimation: 'simple',
  },
  rare: {
    bgColor: '#0070DD', // Blue
    border: 'border-blue-300/80',
    glowColor: 'rgba(0, 112, 221, 0.5)',
    text: 'text-white',
    badge: 'bg-white/30 text-white',
    iconBg: 'bg-white/40',
    borderStyle: 'gold', // Gold: warm gradient + light shimmer
    glowStyle: 'gold',
    revealAnimation: 'rare', // Rare: flip + burst + particle effect
  },
  epic: {
    bgColor: '#A335EE', // Purple
    border: 'border-purple-300/80',
    glowColor: 'rgba(163, 53, 238, 0.5)',
    text: 'text-white',
    badge: 'bg-white/30 text-white',
    iconBg: 'bg-white/40',
    borderStyle: 'gold',
    glowStyle: 'gold',
    revealAnimation: 'rare',
  },
  legendary: {
    bgColor: '#FF8000', // Orange/Gold
    border: 'border-orange-300/80',
    glowColor: 'rgba(255, 128, 0, 0.6)',
    text: 'text-white',
    badge: 'bg-white/40 text-white',
    iconBg: 'bg-white/50',
    borderStyle: 'holo', // Holo: animated gradient overlay, slow movement
    glowStyle: 'holo',
    revealAnimation: 'rare',
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
  isTracked,
  trackedWeeks,
  trackedProgress,
  tier,
  onUpgradeClick,
  isFlipped: controlledIsFlipped,
  onFlipChange,
  triggerEntrance,
}: AchievementCardProps) {
  const style = rarityStyles[achievement.rarity as keyof typeof rarityStyles] || rarityStyles.common
  const isUnlocked = status === 'unlocked'
  const isLockedPremium = status === 'locked_premium'
  const icon = getIcon(achievement.iconKey, achievement.rarity)
  const [internalIsFlipped, setInternalIsFlipped] = useState(false)
  const [hasRevealed, setHasRevealed] = useState(false)
  const [entranceKey, setEntranceKey] = useState(0)
  const rarityIcon = rarityIcons[achievement.rarity] || rarityIcons.common
  const isRareReveal = style.revealAnimation === 'rare' && isUnlocked && !hasRevealed
  
  // Trigger entrance animation when triggerEntrance changes
  useEffect(() => {
    if (triggerEntrance) {
      setEntranceKey(prev => prev + 1)
      setHasRevealed(false)
    }
  }, [triggerEntrance])
  
  // Use controlled flip state if provided, otherwise use internal state
  const isFlipped = controlledIsFlipped !== undefined ? controlledIsFlipped : internalIsFlipped
  
  const handleFlipChange = (flipped: boolean) => {
    if (controlledIsFlipped === undefined) {
      setInternalIsFlipped(flipped)
    }
    onFlipChange?.(flipped)
    
    // Mark as revealed when first flipped (for rare cards)
    if (flipped && isRareReveal) {
      setHasRevealed(true)
    }
  }
  
  const cardVariant = achievement.cardVariant || 'standard'
  const isFoil = cardVariant === 'foil'
  const isFoilGold = cardVariant === 'foilGold'
  const isFoilSilver = cardVariant === 'foilSilver'
  const isPrismatic = cardVariant === 'prismatic'
  const isNeon = cardVariant === 'neon'
  const isShiny = cardVariant === 'shiny'
  const isFullArt = cardVariant === 'fullArt'
  
         // Get appearance config
         const appearance = achievement.appearance || {}
         const titleFontFamilyRaw = appearance.titleFontFamily || 'system-ui'
         const bodyFontFamilyRaw = appearance.bodyFontFamily || 'system-ui'
         // Ensure fonts with spaces are properly quoted
         const titleFontFamily = titleFontFamilyRaw.includes(' ') ? `"${titleFontFamilyRaw}"` : titleFontFamilyRaw
         const bodyFontFamily = bodyFontFamilyRaw.includes(' ') ? `"${bodyFontFamilyRaw}"` : bodyFontFamilyRaw
         const titleLetterSpacing = appearance.titleLetterSpacing || 0
         const titleCase = appearance.titleCase || 'normal'
         const titleColor = appearance.titleColor
         const bodyColor = appearance.bodyColor
         const material = appearance.material || 'standard'
  
  // Check if background image exists - if so, effects should be more transparent
  const hasBackgroundImage = !!appearance.backgroundImage
  const effectOpacity = hasBackgroundImage ? 0.5 : 1.0 // 50% opacity if background image exists, 100% otherwise
  
  // Material texture styles
  const getMaterialStyle = () => {
    // Always use the rarity color as base, unless explicitly overridden
    // Ensure we always have a valid color - use style.bgColor as fallback
    const baseColor = achievement.appearance?.backgroundColor || style.bgColor || '#9D9D9D'
    
    switch (material) {
      case 'wood':
        return {
          background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}dd 50%, ${baseColor}cc 100%),
                      repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px),
                      repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0,0,0,0.02) 8px, rgba(0,0,0,0.02) 10px)`,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%',
          backgroundColor: baseColor, // Fallback color
        }
      case 'stone':
        return {
          background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}ee 25%, ${baseColor}dd 50%, ${baseColor}ee 75%, ${baseColor} 100%),
                      radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 70%, rgba(0,0,0,0.1) 0%, transparent 50%)`,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%',
          backgroundColor: baseColor, // Fallback color
        }
      case 'glass':
        return {
          background: `linear-gradient(135deg, ${baseColor}40 0%, ${baseColor}60 50%, ${baseColor}40 100%)`,
          backdropFilter: 'blur(10px)',
          backgroundColor: `${baseColor}80`, // Semi-transparent base
        }
      case 'steel':
        return {
          background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}cc 25%, ${baseColor} 50%, ${baseColor}cc 75%, ${baseColor} 100%),
                      repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 11px)`,
          backgroundSize: '100% 100%, 100% 100%',
          backgroundColor: baseColor, // Fallback color
        }
      case 'paper':
        return {
          background: `linear-gradient(135deg, #faf9f6 0%, #f5f4f1 100%),
                      repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)`,
          backgroundSize: '100% 100%, 100% 100%',
          backgroundColor: '#faf9f6', // Paper color
        }
      case 'parchment':
        return {
          background: `linear-gradient(135deg, #f4e8d0 0%, #e8dcc0 50%, #f4e8d0 100%),
                      radial-gradient(ellipse at 50% 0%, rgba(139,69,19,0.1) 0%, transparent 50%),
                      repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(139,69,19,0.03) 1px, rgba(139,69,19,0.03) 2px)`,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%',
          backgroundColor: '#f4e8d0', // Parchment color
        }
      default:
        // Standard material - just use the base color
        // CRITICAL: Always ensure backgroundColor is set
        return {
          backgroundColor: baseColor,
        }
    }
  }
  
  const materialStyle = getMaterialStyle()
  
  // Tracked achievement progress (weeks-based)
  const trackedProgressPercent = isTracked && trackedWeeks && trackedProgress !== undefined 
    ? Math.min((trackedProgress / trackedWeeks) * 100, 100) 
    : 0
  
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

  // Entrance animations based on rarity
  const getEntranceAnimation = () => {
    const rarity = achievement.rarity as keyof typeof rarityStyles
    const revealType = style.revealAnimation
    
    if (revealType === 'rare') {
      // Rare/Epic/Legendary: dramatic entrance with scale and rotation
      return {
        initial: { opacity: 0, y: 50, scale: 0.3, rotateY: -180 },
        animate: { 
          opacity: (isUnlocked || isInProgress) ? 1 : 0.5, 
          y: 0, 
          scale: isRareReveal ? [0.3, 1.2, 1] : 1,
          rotateY: 0,
        },
        transition: { 
          duration: isRareReveal ? 0.8 : 0.6, 
          ease: [0.34, 1.56, 0.64, 1],
          scale: isRareReveal ? { times: [0, 0.5, 1], duration: 0.8 } : undefined,
        }
      }
    } else {
      // Common/Uncommon: simple fade and slide
      return {
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { 
          opacity: (isUnlocked || isInProgress) ? 1 : 0.5, 
          y: 0, 
          scale: 1,
        },
        transition: { 
          duration: 0.4, 
          ease: [0.22, 1, 0.36, 1],
        }
      }
    }
  }
  
  const entranceAnim = getEntranceAnimation()

  return (
    <motion.div
      key={entranceKey}
      initial={entranceAnim.initial}
      animate={entranceAnim.animate}
      transition={entranceAnim.transition}
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
      <motion.div
        className={cn(
          "relative w-full h-full",
          "[transform-style:preserve-3d]",
        )}
        animate={{
          rotateY: isFlipped && (isUnlocked || isInProgress) ? 180 : 0,
          scale: isRareReveal && isFlipped ? [1, 1.05, 1] : 1,
        }}
        transition={{
          rotateY: {
            duration: isRareReveal ? 0.8 : 0.7,
            ease: isRareReveal ? [0.34, 1.56, 0.64, 1] : 'ease-out',
          },
          scale: isRareReveal ? {
            duration: 0.8,
            times: [0, 0.5, 1],
          } : undefined,
        }}
      >
        {/* Front of Card */}
        <motion.div
          className={cn(
            "absolute inset-0 w-full h-full",
            "[backface-visibility:hidden]",
            "overflow-hidden rounded-2xl",
            "border-2",
            isHailCaesar ? "border-gray-300/60" : isBlitzkrieg ? "border-amber-900/60" : isDoppelganger ? "border-blue-600/70" : (isATAR || isAllRounder) ? "border-blue-800/70" : (isFoil || isFoilGold || isFoilSilver || isPrismatic || isNeon) ? "border-white/60" : style.border,
            (isUnlocked || isInProgress) && "cursor-pointer",
            (isFoil || isFoilGold || isFoilSilver || isPrismatic || isNeon || isShiny) && !isHailCaesar && !isBlitzkrieg && !isDoppelganger && !isATAR && !isAllRounder && "foil-card"
          )}
          animate={{
            opacity: isFlipped ? 0 : 1,
            rotateY: 0,
          }}
          transition={{ duration: 0.7, ease: 'ease-out' }}
          style={{
            rotateY: 0,
            ...(isHailCaesar || isBlitzkrieg || isDoppelganger || isATAR || isAllRounder
              ? {
                  backgroundColor: isHailCaesar ? '#F5F5F0' : isBlitzkrieg ? '#4A5D23' : isDoppelganger ? '#1E3A8A' : '#003366',
                  backgroundImage: isHailCaesar ? 'url(/achievements/roman-marble-texture.png)' : 'none',
                  backgroundSize: isHailCaesar ? 'cover' : undefined,
                  backgroundPosition: isHailCaesar ? 'center' : undefined,
                  backgroundBlendMode: isHailCaesar ? 'overlay' : undefined,
                }
              : achievement.appearance?.backgroundImage
              ? {
                  backgroundColor: achievement.appearance?.backgroundColor || style.bgColor || '#9D9D9D',
                  backgroundImage: `url(${achievement.appearance.backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  ...(material !== 'standard' ? (() => {
                    const { backgroundColor, ...rest } = materialStyle;
                    return rest;
                  })() : {}),
                }
              : {
                  ...materialStyle,
                  // Ensure backgroundColor is always set, even if materialStyle doesn't have it
                  backgroundColor: materialStyle.backgroundColor || achievement.appearance?.backgroundColor || style.bgColor || '#9D9D9D',
                }),
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
                : isPrismatic
                ? '0 10px 40px -5px rgba(59, 130, 246, 0.4), 0 0 60px rgba(168, 85, 247, 0.3), 0 0 80px rgba(236, 72, 153, 0.2)'
                : isNeon
                ? '0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.4), 0 0 60px rgba(34, 197, 94, 0.3), 0 10px 40px -5px rgba(34, 197, 94, 0.2)'
                : isShiny
                ? '0 10px 40px -5px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.2)'
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
          
          {/* Card Variant Effects on Front */}
          {isFoil && !isHailCaesar && (
            <>
              <div 
                className="absolute inset-0 foil-gradient"
                style={{
                  opacity: effectOpacity,
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

          {isFoilGold && (
            <>
              <div 
                className="absolute inset-0 foil-gradient"
                style={{
                  opacity: effectOpacity,
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
                className="absolute inset-0 foil-gradient"
                style={{
                  opacity: effectOpacity,
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

          {isPrismatic && (
            <>
              <div 
                className="absolute inset-0 foil-gradient"
                style={{
                  opacity: effectOpacity,
                  background: `linear-gradient(135deg, 
                    ${style.bgColor} 0%, 
                    rgba(6, 182, 212, 0.7) 20%,
                    rgba(59, 130, 246, 0.7) 40%,
                    rgba(168, 85, 247, 0.7) 60%,
                    rgba(236, 72, 153, 0.7) 80%,
                    ${style.bgColor} 100%)`,
                }}
              />
              <motion.div
                className="absolute inset-0 foil-shimmer"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'linear',
                }}
                style={{
                  background: `linear-gradient(
                    45deg,
                    transparent 25%,
                    rgba(255, 255, 255, 0.6) 50%,
                    transparent 75%
                  )`,
                  backgroundSize: '200% 200%',
                }}
              />
              {/* Prismatic light refraction effect */}
              <motion.div
                className="absolute inset-0 opacity-40"
                animate={{
                  background: [
                    'linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                    'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                    'linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                  ],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </>
          )}

          {isNeon && (
            <>
              {/* Neon glow border effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                  opacity: effectOpacity,
                  boxShadow: 'inset 0 0 20px rgba(34, 197, 94, 0.5), inset 0 0 40px rgba(34, 197, 94, 0.3)',
                }}
                animate={{
                  boxShadow: [
                    'inset 0 0 20px rgba(34, 197, 94, 0.5), inset 0 0 40px rgba(34, 197, 94, 0.3)',
                    'inset 0 0 30px rgba(34, 197, 94, 0.7), inset 0 0 50px rgba(34, 197, 94, 0.5)',
                    'inset 0 0 20px rgba(34, 197, 94, 0.5), inset 0 0 40px rgba(34, 197, 94, 0.3)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              {/* Animated neon scan line */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    'linear-gradient(0deg, transparent 0%, rgba(34, 197, 94, 0.3) 50%, transparent 100%)',
                    'linear-gradient(0deg, transparent 0%, rgba(34, 197, 94, 0.3) 50%, transparent 100%)',
                  ],
                  backgroundPosition: ['0% 0%', '0% 100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  backgroundSize: '100% 200%',
                }}
              />
            </>
          )}

          {isShiny && (
            <>
              <motion.div
                className="absolute inset-0"
                style={{ opacity: effectOpacity }}
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
          
          {/* Locked Overlay - only show if not in progress */}
          {!isUnlocked && !isInProgress && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
              <div className="bg-black/60 rounded-full p-3 shadow-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
          
          {/* In Progress - no overlay, show at full opacity */}

          {/* Rarity Icon - Top Left Corner */}
          {rarityIcon.icon && isUnlocked && (
            <div className="absolute top-2 left-2 z-20">
              <div 
                className="text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-[10px] font-normal opacity-80"
                title={rarityIcon.label}
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                {rarityIcon.icon}
              </div>
            </div>
          )}

          {/* Premium Badge */}
          {achievement.isPremiumOnly && isUnlocked && (
            <div className="absolute top-3 right-3 z-20">
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-1.5 shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          )}

          {/* Rarity-based Border Effects - Overlay on existing border */}
          {isUnlocked && !isFoil && !isFoilGold && !isFoilSilver && !isPrismatic && !isNeon && !isHailCaesar && !isBlitzkrieg && !isDoppelganger && !isATAR && !isAllRounder && (
            <>
              {/* Silver Border Effect (Uncommon) */}
              {style.borderStyle === 'silver' && (
                <>
                  <div 
                    className="absolute -inset-[2px] rounded-2xl pointer-events-none z-10"
                    style={{
                      border: '2px solid transparent',
                      background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, rgba(192, 192, 192, 0.8), rgba(255, 255, 255, 0.9), rgba(192, 192, 192, 0.8)) border-box',
                      backgroundClip: 'padding-box, border-box',
                    }}
                  />
                  <motion.div
                    className="absolute -inset-[2px] rounded-2xl pointer-events-none z-10"
                    style={{
                      background: 'linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
                    }}
                    animate={{
                      backgroundPosition: ['-200% 0', '200% 0'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </>
              )}

              {/* Gold Border Effect (Rare/Epic) */}
              {style.borderStyle === 'gold' && (
                <>
                  <div 
                    className="absolute -inset-[2px] rounded-2xl pointer-events-none z-10"
                    style={{
                      border: '2px solid transparent',
                      background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 255, 255, 1), rgba(255, 165, 0, 0.9)) border-box',
                      backgroundClip: 'padding-box, border-box',
                    }}
                  />
                  <motion.div
                    className="absolute -inset-[2px] rounded-2xl pointer-events-none z-10"
                    style={{
                      background: 'linear-gradient(135deg, transparent 30%, rgba(255, 215, 0, 0.4) 50%, transparent 70%)',
                    }}
                    animate={{
                      backgroundPosition: ['-200% 0', '200% 0'],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </>
              )}

              {/* Holo Border Effect (Legendary) */}
              {style.borderStyle === 'holo' && (
                <>
                  <div 
                    className="absolute -inset-[2px] rounded-2xl pointer-events-none z-10"
                    style={{
                      border: '2px solid transparent',
                      background: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, rgba(255, 0, 150, 0.8), rgba(0, 255, 255, 0.8), rgba(255, 255, 0, 0.8), rgba(255, 0, 150, 0.8)) border-box',
                      backgroundClip: 'padding-box, border-box',
                      backgroundSize: '200% 200%',
                    }}
                  />
                  <motion.div
                    className="absolute -inset-[2px] rounded-2xl pointer-events-none z-10"
                    style={{
                      background: 'linear-gradient(45deg, rgba(255, 0, 150, 0.3), rgba(0, 255, 255, 0.3), rgba(255, 255, 0, 0.3), rgba(255, 0, 150, 0.3))',
                      backgroundSize: '200% 200%',
                    }}
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </>
              )}
            </>
          )}

          {/* Rarity-based Glow Effects */}
          {isUnlocked && style.glowStyle !== 'none' && (
            <>
              {style.glowStyle === 'silver' && (
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
                  style={{
                    boxShadow: '0 0 20px rgba(192, 192, 192, 0.4), 0 0 40px rgba(255, 255, 255, 0.2)',
                  }}
                  animate={{
                    opacity: [0.6, 0.8, 0.6],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
              {style.glowStyle === 'gold' && (
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
                  style={{
                    boxShadow: '0 0 30px rgba(255, 215, 0, 0.5), 0 0 60px rgba(255, 165, 0, 0.3)',
                  }}
                  animate={{
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
              {style.glowStyle === 'holo' && (
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
                  style={{
                    boxShadow: '0 0 40px rgba(255, 0, 150, 0.4), 0 0 60px rgba(0, 255, 255, 0.3), 0 0 80px rgba(255, 255, 0, 0.2)',
                  }}
                  animate={{
                    boxShadow: [
                      '0 0 40px rgba(255, 0, 150, 0.4), 0 0 60px rgba(0, 255, 255, 0.3), 0 0 80px rgba(255, 255, 0, 0.2)',
                      '0 0 40px rgba(0, 255, 255, 0.4), 0 0 60px rgba(255, 255, 0, 0.3), 0 0 80px rgba(255, 0, 150, 0.2)',
                      '0 0 40px rgba(255, 255, 0, 0.4), 0 0 60px rgba(255, 0, 150, 0.3), 0 0 80px rgba(0, 255, 255, 0.2)',
                      '0 0 40px rgba(255, 0, 150, 0.4), 0 0 60px rgba(0, 255, 255, 0.3), 0 0 80px rgba(255, 255, 0, 0.2)',
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              )}
            </>
          )}

          {/* Rare Reveal Animation - Particle Burst */}
          {isRareReveal && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5 }}
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                  style={{
                    background: style.glowStyle === 'holo' 
                      ? `hsl(${(i * 30) % 360}, 100%, 60%)`
                      : style.glowStyle === 'gold'
                      ? 'rgba(255, 215, 0, 0.9)'
                      : 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 0 10px currentColor',
                  }}
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: Math.cos((i * 30) * Math.PI / 180) * 100,
                    y: Math.sin((i * 30) * Math.PI / 180) * 100,
                    scale: [0, 1.5, 0],
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.1,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </motion.div>
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
                {achievement.iconKey && (achievement.iconKey.startsWith('http') || achievement.iconKey.startsWith('blob:') || achievement.iconKey.startsWith('/') || achievement.iconKey.includes('.')) ? (
                  // PNG Sticker - no container, natural size
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className={cn(
                      "relative",
                      (isHailCaesar || isBlitzkrieg || isDoppelganger) ? "min-h-0" : ""
                    )}
                    style={(isHailCaesar || isBlitzkrieg || isDoppelganger) ? { 
                      maxHeight: isBlitzkrieg ? '100px' : isDoppelganger ? '110px' : '110px', 
                      maxWidth: '100%' 
                    } : {
                      maxHeight: '120px',
                      maxWidth: '100%'
                    }}
                  >
                    <img 
                      src={achievement.iconKey} 
                      alt={achievement.name}
                      className={cn(
                        "object-contain",
                        isHailCaesar ? "h-auto max-h-[110px] sm:max-h-[120px] w-auto" : isBlitzkrieg ? "h-auto max-h-[100px] sm:max-h-[110px] w-auto" : isDoppelganger ? "h-auto max-h-[110px] sm:max-h-[120px] w-auto" : "h-auto max-h-[120px] w-auto"
                      )}
                      style={{ 
                        height: 'auto',
                        width: 'auto',
                        filter: isBlitzkrieg ? 'sepia(25%) contrast(115%) brightness(0.85) saturate(75%)' : undefined,
                      }}
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
                  </motion.div>
                ) : (
                  // Emoji icon - keep in container
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
                    <span className={cn(
                      (isHailCaesar || isBlitzkrieg || isDoppelganger) ? "text-4xl sm:text-5xl" : "text-4xl sm:text-5xl"
                    )} role="img" aria-label={achievement.name}>
                      {icon}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Title */}
              <h3 className={cn(
                "font-bold mb-2 text-center",
                isHailCaesar ? "text-gray-900 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] font-bluu-next tracking-wide text-xl" : isBlitzkrieg ? "text-amber-400 font-black tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8),0_0_8px_rgba(255,165,0,0.5)] text-xl sm:text-2xl font-germania" : isDoppelganger ? "text-white font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8),0_0_8px_rgba(220,38,38,0.6)] text-sm sm:text-base font-backissues uppercase" : (isATAR || isAllRounder) ? "text-white font-public-sans tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-lg sm:text-xl" : "text-base",
                "line-clamp-2 leading-tight break-words overflow-wrap-anywhere",
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
                  ...(titleColor && { color: titleColor }),
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
                "line-clamp-2 leading-tight break-words overflow-wrap-anywhere",
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
                  ...(bodyColor && { color: bodyColor }),
                }),
              }}
              >
                {achievement.shortDescription}
              </p>
            </div>

            {/* Footer */}
            <div className={cn("space-y-2", isBlitzkrieg ? "mt-auto" : "mt-auto")}>
              {/* Tracked Achievement Progress Bar - Show for tracked achievements */}
              {isTracked && trackedWeeks && trackedProgress !== undefined && (
                <div className="space-y-1 relative z-20">
                  <div className={cn(
                    "w-full h-2 rounded-full overflow-hidden",
                    isHailCaesar ? "bg-gray-300/40 backdrop-blur-sm" : isBlitzkrieg ? "bg-amber-900/40 backdrop-blur-sm" : isDoppelganger ? "bg-red-900/40 backdrop-blur-sm" : (isATAR || isAllRounder) ? "bg-blue-900/40 backdrop-blur-sm" : "bg-white/20 backdrop-blur-sm"
                  )}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${trackedProgressPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        isHailCaesar ? "from-gray-600 to-gray-700" : isBlitzkrieg ? "from-amber-500 to-amber-600" : isDoppelganger ? "from-red-500 to-red-600" : (isATAR || isAllRounder) ? "from-blue-500 to-blue-600" : "from-blue-400 to-blue-500",
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
                      Week {trackedProgress} / {trackedWeeks}
                    </span>
                    <span className="font-bold">
                      {Math.round(trackedProgressPercent)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Progress Bar - Show for in-progress achievements */}
              {isInProgress && progressMax && !isTracked && (
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
        </motion.div>

        {/* Back of Card */}
        {(isUnlocked || isInProgress) && (
          <motion.div
            className={cn(
              "absolute inset-0 w-full h-full",
              "[backface-visibility:hidden]",
              "overflow-hidden rounded-2xl",
              "p-4",
            "border-2",
            isHailCaesar ? "border-gray-300/60" : isBlitzkrieg ? "border-amber-900/60" : isDoppelganger ? "border-blue-600/70" : (isATAR || isAllRounder) ? "border-blue-800/70" : (isFoil || isFoilGold || isFoilSilver || isPrismatic || isNeon) ? "border-white/60" : style.border,
            "flex flex-col items-center justify-center",
              (isFoil || isFoilGold || isFoilSilver || isPrismatic || isNeon || isShiny) && !isHailCaesar && !isBlitzkrieg && !isDoppelganger && !isATAR && !isAllRounder && "foil-card"
            )}
            animate={{
              opacity: !isFlipped ? 0 : 1,
              rotateY: 180,
            }}
            transition={{ duration: 0.7, ease: 'ease-out' }}
            style={{
              rotateY: 180,
              ...(isHailCaesar || isBlitzkrieg || isDoppelganger || isATAR || isAllRounder
                ? {
                    backgroundColor: isHailCaesar ? '#F5F5F0' : isBlitzkrieg ? '#4A5D23' : isDoppelganger ? '#1E3A8A' : '#003366',
                    backgroundImage: isHailCaesar ? 'url(/achievements/roman-marble-texture.png)' : 'none',
                    backgroundSize: isHailCaesar ? 'cover' : undefined,
                    backgroundPosition: isHailCaesar ? 'center' : undefined,
                    backgroundBlendMode: isHailCaesar ? 'overlay' : undefined,
                  }
                : achievement.appearance?.backgroundImage
                ? {
                    backgroundColor: achievement.appearance?.backgroundColor || style.bgColor || '#9D9D9D',
                    backgroundImage: `url(${achievement.appearance.backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    ...(material !== 'standard' ? (() => {
                      const { backgroundColor, ...rest } = materialStyle;
                      return rest;
                    })() : {}),
                  }
                : {
                    ...materialStyle,
                    // Ensure backgroundColor is always set, even if materialStyle doesn't have it
                    backgroundColor: materialStyle.backgroundColor || achievement.appearance?.backgroundColor || style.bgColor || '#9D9D9D',
                  }),
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
            
            {/* Rarity Icon (Back) - Top Left Corner */}
            {rarityIcon.icon && isUnlocked && (
              <div className="absolute top-2 left-2 z-20">
                <div 
                  className="text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-[10px] font-normal opacity-80"
                  title={rarityIcon.label}
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {rarityIcon.icon}
                </div>
              </div>
            )}

            {/* Rarity-based Border Effects (Back) - Overlay on existing border */}
            {isUnlocked && !isFoil && !isFoilGold && !isFoilSilver && !isPrismatic && !isNeon && !isHailCaesar && !isBlitzkrieg && !isDoppelganger && !isATAR && !isAllRounder && (
              <>
                {/* Silver Border Effect (Uncommon) */}
                {style.borderStyle === 'silver' && (
                  <>
                    <div 
                      className="absolute -inset-[2px] rounded-2xl pointer-events-none z-10"
                      style={{
                        border: '2px solid transparent',
                        background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, rgba(192, 192, 192, 0.8), rgba(255, 255, 255, 0.9), rgba(192, 192, 192, 0.8)) border-box',
                        backgroundClip: 'padding-box, border-box',
                      }}
                    />
                    <motion.div
                      className="absolute -inset-[2px] rounded-2xl pointer-events-none z-10"
                      style={{
                        background: 'linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
                      }}
                      animate={{
                        backgroundPosition: ['-200% 0', '200% 0'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  </>
                )}

                {/* Gold Border Effect (Rare/Epic) */}
                {style.borderStyle === 'gold' && (
                  <>
                    <div 
                      className="absolute -inset-[2px] rounded-2xl pointer-events-none z-10"
                      style={{
                        border: '2px solid transparent',
                        background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 255, 255, 1), rgba(255, 165, 0, 0.9)) border-box',
                        backgroundClip: 'padding-box, border-box',
                      }}
                    />
                    <motion.div
                      className="absolute -inset-[2px] rounded-2xl pointer-events-none z-10"
                      style={{
                        background: 'linear-gradient(135deg, transparent 30%, rgba(255, 215, 0, 0.4) 50%, transparent 70%)',
                      }}
                      animate={{
                        backgroundPosition: ['-200% 0', '200% 0'],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  </>
                )}

                {/* Holo Border Effect (Legendary) */}
                {style.borderStyle === 'holo' && (
                  <>
                    <div 
                      className="absolute -inset-[2px] rounded-2xl pointer-events-none z-10"
                      style={{
                        border: '2px solid transparent',
                        background: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, rgba(255, 0, 150, 0.8), rgba(0, 255, 255, 0.8), rgba(255, 255, 0, 0.8), rgba(255, 0, 150, 0.8)) border-box',
                        backgroundClip: 'padding-box, border-box',
                        backgroundSize: '200% 200%',
                      }}
                    />
                    <motion.div
                      className="absolute -inset-[2px] rounded-2xl pointer-events-none z-10"
                      style={{
                        background: 'linear-gradient(45deg, rgba(255, 0, 150, 0.3), rgba(0, 255, 255, 0.3), rgba(255, 255, 0, 0.3), rgba(255, 0, 150, 0.3))',
                        backgroundSize: '200% 200%',
                      }}
                      animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  </>
                )}
              </>
            )}

            {/* Rarity-based Glow Effects (Back) */}
            {isUnlocked && style.glowStyle !== 'none' && (
              <>
                {style.glowStyle === 'silver' && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
                    style={{
                      boxShadow: '0 0 20px rgba(192, 192, 192, 0.4), 0 0 40px rgba(255, 255, 255, 0.2)',
                    }}
                    animate={{
                      opacity: [0.6, 0.8, 0.6],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
                {style.glowStyle === 'gold' && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
                    style={{
                      boxShadow: '0 0 30px rgba(255, 215, 0, 0.5), 0 0 60px rgba(255, 165, 0, 0.3)',
                    }}
                    animate={{
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
                {style.glowStyle === 'holo' && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
                    style={{
                      boxShadow: '0 0 40px rgba(255, 0, 150, 0.4), 0 0 60px rgba(0, 255, 255, 0.3), 0 0 80px rgba(255, 255, 0, 0.2)',
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 40px rgba(255, 0, 150, 0.4), 0 0 60px rgba(0, 255, 255, 0.3), 0 0 80px rgba(255, 255, 0, 0.2)',
                        '0 0 40px rgba(0, 255, 255, 0.4), 0 0 60px rgba(255, 255, 0, 0.3), 0 0 80px rgba(255, 0, 150, 0.2)',
                        '0 0 40px rgba(255, 255, 0, 0.4), 0 0 60px rgba(255, 0, 150, 0.3), 0 0 80px rgba(0, 255, 255, 0.2)',
                        '0 0 40px rgba(255, 0, 150, 0.4), 0 0 60px rgba(0, 255, 255, 0.3), 0 0 80px rgba(255, 255, 0, 0.2)',
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                )}
              </>
            )}

            {/* Card Variant Effects on Back */}
            {isFoil && !isHailCaesar && (
              <>
                <div 
                  className="absolute inset-0 foil-gradient"
                  style={{
                    opacity: effectOpacity,
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
                  className="absolute inset-0 foil-gradient"
                  style={{
                    opacity: effectOpacity,
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
                  className="absolute inset-0 foil-gradient"
                  style={{
                    opacity: effectOpacity,
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

            {isPrismatic && (
              <>
                <div 
                  className="absolute inset-0 foil-gradient"
                  style={{
                    opacity: effectOpacity,
                    background: `linear-gradient(135deg, 
                      ${style.bgColor} 0%, 
                      rgba(6, 182, 212, 0.7) 20%,
                      rgba(59, 130, 246, 0.7) 40%,
                      rgba(168, 85, 247, 0.7) 60%,
                      rgba(236, 72, 153, 0.7) 80%,
                      ${style.bgColor} 100%)`,
                  }}
                />
                <motion.div
                  className="absolute inset-0 foil-shimmer"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'linear',
                  }}
                  style={{
                    background: `linear-gradient(
                      45deg,
                      transparent 25%,
                      rgba(255, 255, 255, 0.6) 50%,
                      transparent 75%
                    )`,
                    backgroundSize: '200% 200%',
                  }}
                />
                {/* Prismatic light refraction effect */}
                <motion.div
                  className="absolute inset-0 opacity-40"
                  animate={{
                    background: [
                      'linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                      'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                      'linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                    ],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </>
            )}

            {isNeon && (
              <>
                {/* Neon glow border effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    opacity: effectOpacity,
                    boxShadow: 'inset 0 0 20px rgba(34, 197, 94, 0.5), inset 0 0 40px rgba(34, 197, 94, 0.3)',
                  }}
                  animate={{
                    boxShadow: [
                      'inset 0 0 20px rgba(34, 197, 94, 0.5), inset 0 0 40px rgba(34, 197, 94, 0.3)',
                      'inset 0 0 30px rgba(34, 197, 94, 0.7), inset 0 0 50px rgba(34, 197, 94, 0.5)',
                      'inset 0 0 20px rgba(34, 197, 94, 0.5), inset 0 0 40px rgba(34, 197, 94, 0.3)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                {/* Animated neon scan line */}
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    background: [
                      'linear-gradient(0deg, transparent 0%, rgba(34, 197, 94, 0.3) 50%, transparent 100%)',
                      'linear-gradient(0deg, transparent 0%, rgba(34, 197, 94, 0.3) 50%, transparent 100%)',
                    ],
                    backgroundPosition: ['0% 0%', '0% 100%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    backgroundSize: '100% 200%',
                  }}
                />
              </>
            )}

            {isShiny && (
              <>
                <motion.div
                  className="absolute inset-0"
                  style={{ opacity: effectOpacity }}
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
                  "leading-tight break-words overflow-wrap-anywhere",
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
                  ...(titleColor && { color: titleColor }),
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
                  "tracking-wide break-words overflow-wrap-anywhere"
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
                    ...(bodyColor && { color: bodyColor }),
                  }),
                }}
                >
                  {achievement.longDescription || achievement.shortDescription}
                </p>
              </div>

              {/* Tracked Achievement Progress Bar on Back - Show for tracked achievements */}
              {isTracked && trackedWeeks && trackedProgress !== undefined && (
                <div className="space-y-1.5 pt-1">
                  <div className={cn(
                    "w-full h-2 rounded-full overflow-hidden",
                    isHailCaesar ? "bg-gray-300/40 backdrop-blur-sm" : isBlitzkrieg ? "bg-amber-900/40 backdrop-blur-sm" : isDoppelganger ? "bg-red-900/40 backdrop-blur-sm" : (isATAR || isAllRounder) ? "bg-blue-900/40 backdrop-blur-sm" : "bg-white/20 backdrop-blur-sm"
                  )}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${trackedProgressPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        isHailCaesar ? "from-gray-600 to-gray-700" : isBlitzkrieg ? "from-amber-500 to-amber-600" : isDoppelganger ? "from-red-500 to-red-600" : (isATAR || isAllRounder) ? "from-blue-500 to-blue-600" : "from-blue-400 to-blue-500",
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
                      Week {trackedProgress} / {trackedWeeks}
                    </span>
                    <span className="font-bold">
                      {Math.round(trackedProgressPercent)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Progress Bar on Back - Show for in-progress achievements */}
              {isInProgress && progressMax && !isTracked && (
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
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

