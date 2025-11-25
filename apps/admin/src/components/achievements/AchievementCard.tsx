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
      overlayEffect?: 'none' | 'particle' | 'vignette' | 'scanlines' | 'grid' | 'dotmatrix' | 'noise'
      titleTextEffect?: 'none' | 'etched' | 'contoured' | 'black' | 'white' | 'glow' | 'shadow'
      bodyTextEffect?: 'none' | 'etched' | 'contoured' | 'black' | 'white' | 'glow' | 'shadow'
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
  onTitleChange?: (title: string) => void // Callback when title is edited
  onDescriptionChange?: (description: string) => void // Callback when description is edited
  isEditable?: boolean // Enable direct editing of title/description
  disableFlip?: boolean // Disable card flipping on hover
  forceShowProgress?: boolean // Force show progress bar even when unlocked (for preview/editor)
}

// Default card style - rarity removed, using foil/special effects instead
const defaultCardStyle = {
  bgColor: '#9D9D9D', // Gray
  border: 'border-gray-400/80',
  glowColor: 'rgba(157, 157, 157, 0.5)',
  text: 'text-white',
  badge: 'bg-white/40 text-white',
  iconBg: 'bg-white/50',
  borderStyle: 'flat',
  glowStyle: 'none',
  revealAnimation: 'simple',
}

const getIcon = (iconKey: string | null | undefined) => {
  if (iconKey) {
    // Map icon keys to emojis if needed
    return iconKey
  }
  
  // Default icon
  return '🏆'
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
  onTitleChange,
  onDescriptionChange,
  isEditable = false,
  disableFlip = false,
  forceShowProgress = false,
}: AchievementCardProps) {
  const style = defaultCardStyle
  const isUnlocked = status === 'unlocked'
  const isLockedPremium = status === 'locked_premium'
  const icon = getIcon(achievement.iconKey)
  const [internalIsFlipped, setInternalIsFlipped] = useState(false)
  const [hasRevealed, setHasRevealed] = useState(false)
  const [entranceKey, setEntranceKey] = useState(0)
  
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
    
    // Mark as revealed when first flipped
    if (flipped) {
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
    // For standard cards, always use rarity color (style.bgColor) to show proper colors:
    // Common: gray (#9D9D9D), Uncommon: green (#1EFF00), Rare: blue (#0070DD), 
    // Epic: purple (#A335EE), Legendary: orange (#FF8000)
    // Only use custom appearance color if it's explicitly set and not empty
    const customColor = achievement.appearance?.backgroundColor
    const baseColor = (customColor && typeof customColor === 'string' && customColor.trim() !== '') ? customColor : style.bgColor || '#9D9D9D'
    
    switch (material) {
      case 'wood':
        // Realistic wood grain texture
        return {
          background: `
            linear-gradient(135deg, 
              #8B4513 0%, 
              #A0522D 15%, 
              #8B4513 30%, 
              #654321 45%, 
              #8B4513 60%, 
              #A0522D 75%, 
              #8B4513 90%, 
              #654321 100%
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 2px,
              rgba(101, 67, 33, 0.3) 2px,
              rgba(101, 67, 33, 0.3) 4px,
              transparent 4px,
              transparent 6px,
              rgba(139, 69, 19, 0.2) 6px,
              rgba(139, 69, 19, 0.2) 8px
            ),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 1px,
              rgba(0, 0, 0, 0.1) 1px,
              rgba(0, 0, 0, 0.1) 2px,
              transparent 2px,
              transparent 3px,
              rgba(101, 67, 33, 0.15) 3px,
              rgba(101, 67, 33, 0.15) 4px
            ),
            radial-gradient(
              ellipse 200% 100% at 50% 50%,
              rgba(160, 82, 45, 0.3) 0%,
              transparent 50%
            ),
            radial-gradient(
              ellipse 150% 80% at 30% 40%,
              rgba(139, 69, 19, 0.2) 0%,
              transparent 40%
            ),
            radial-gradient(
              ellipse 150% 80% at 70% 60%,
              rgba(101, 67, 33, 0.25) 0%,
              transparent 40%
            )
          `,
          backgroundSize: '100% 100%, 8px 100%, 100% 4px, 100% 100%, 100% 100%, 100% 100%',
          backgroundColor: '#8B4513', // Saddle brown base
          boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.1)',
        }
      case 'stone':
        // Realistic stone texture with natural variations
        return {
          background: `
            linear-gradient(135deg,
              #808080 0%,
              #696969 10%,
              #778899 20%,
              #708090 30%,
              #696969 40%,
              #808080 50%,
              #708090 60%,
              #778899 70%,
              #696969 80%,
              #808080 90%,
              #708090 100%
            ),
            radial-gradient(
              circle at 20% 30%,
              rgba(255, 255, 255, 0.15) 0%,
              transparent 30%
            ),
            radial-gradient(
              circle at 80% 70%,
              rgba(0, 0, 0, 0.2) 0%,
              transparent 30%
            ),
            radial-gradient(
              circle at 50% 50%,
              rgba(105, 105, 105, 0.3) 0%,
              transparent 40%
            ),
            radial-gradient(
              circle at 30% 60%,
              rgba(112, 128, 144, 0.25) 0%,
              transparent 35%
            ),
            radial-gradient(
              circle at 70% 40%,
              rgba(119, 136, 153, 0.2) 0%,
              transparent 35%
            ),
            repeating-linear-gradient(
              45deg,
              transparent 0px,
              transparent 2px,
              rgba(0, 0, 0, 0.05) 2px,
              rgba(0, 0, 0, 0.05) 3px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent 0px,
              transparent 3px,
              rgba(255, 255, 255, 0.03) 3px,
              rgba(255, 255, 255, 0.03) 4px
            )
          `,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 20px 20px, 25px 25px',
          backgroundColor: '#808080', // Gray base
          boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.3), inset 0 0 60px rgba(0, 0, 0, 0.1)',
        }
      case 'glass':
        // Realistic frosted glass with transparency and light refraction
        return {
          background: `
            linear-gradient(135deg,
              rgba(255, 255, 255, 0.1) 0%,
              rgba(255, 255, 255, 0.05) 25%,
              transparent 50%,
              rgba(255, 255, 255, 0.05) 75%,
              rgba(255, 255, 255, 0.1) 100%
            ),
            radial-gradient(
              circle at 30% 30%,
              rgba(255, 255, 255, 0.2) 0%,
              transparent 40%
            ),
            radial-gradient(
              circle at 70% 70%,
              rgba(255, 255, 255, 0.15) 0%,
              transparent 40%
            ),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 1px,
              rgba(255, 255, 255, 0.05) 1px,
              rgba(255, 255, 255, 0.05) 2px
            )
          `,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 2px',
          backgroundColor: `${baseColor}40`, // Semi-transparent base
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.1), 0 0 20px rgba(255, 255, 255, 0.1)',
        }
      case 'steel':
        // Realistic brushed steel/metal texture
        return {
          background: `
            linear-gradient(135deg,
              #C0C0C0 0%,
              #D3D3D3 10%,
              #C0C0C0 20%,
              #A9A9A9 30%,
              #C0C0C0 40%,
              #D3D3D3 50%,
              #C0C0C0 60%,
              #A9A9A9 70%,
              #C0C0C0 80%,
              #D3D3D3 90%,
              #C0C0C0 100%
            ),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 1px,
              rgba(255, 255, 255, 0.3) 1px,
              rgba(255, 255, 255, 0.3) 2px,
              transparent 2px,
              transparent 3px,
              rgba(0, 0, 0, 0.1) 3px,
              rgba(0, 0, 0, 0.1) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 2px,
              rgba(255, 255, 255, 0.2) 2px,
              rgba(255, 255, 255, 0.2) 3px
            ),
            radial-gradient(
              ellipse 200% 50% at 50% 50%,
              rgba(255, 255, 255, 0.4) 0%,
              transparent 50%
            )
          `,
          backgroundSize: '100% 100%, 100% 4px, 8px 100%, 100% 100%',
          backgroundColor: '#C0C0C0', // Silver base
          boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.1), 0 0 20px rgba(192, 192, 192, 0.3)',
        }
      case 'paper':
        // Realistic paper texture with subtle fibers
        return {
          background: `
            linear-gradient(135deg,
              #faf9f6 0%,
              #f5f4f1 25%,
              #faf9f6 50%,
              #f0efe8 75%,
              #faf9f6 100%
            ),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 1px,
              rgba(0, 0, 0, 0.015) 1px,
              rgba(0, 0, 0, 0.015) 2px
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 1px,
              rgba(0, 0, 0, 0.01) 1px,
              rgba(0, 0, 0, 0.01) 2px
            ),
            radial-gradient(
              circle at 20% 30%,
              rgba(0, 0, 0, 0.02) 0%,
              transparent 2px
            ),
            radial-gradient(
              circle at 80% 70%,
              rgba(0, 0, 0, 0.02) 0%,
              transparent 2px
            ),
            radial-gradient(
              circle at 50% 50%,
              rgba(0, 0, 0, 0.015) 0%,
              transparent 1.5px
            )
          `,
          backgroundSize: '100% 100%, 100% 2px, 2px 100%, 3px 3px, 3px 3px, 3px 3px',
          backgroundColor: '#faf9f6', // Paper color
          boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.05)',
        }
      case 'parchment':
        // Realistic aged parchment with natural variations
        return {
          background: `
            linear-gradient(135deg,
              #f4e8d0 0%,
              #e8dcc0 10%,
              #f0e4cc 20%,
              #e8dcc0 30%,
              #f4e8d0 40%,
              #ede0c8 50%,
              #f4e8d0 60%,
              #e8dcc0 70%,
              #f0e4cc 80%,
              #e8dcc0 90%,
              #f4e8d0 100%
            ),
            radial-gradient(
              ellipse 150% 100% at 50% 0%,
              rgba(139, 69, 19, 0.15) 0%,
              transparent 50%
            ),
            radial-gradient(
              ellipse 120% 80% at 30% 40%,
              rgba(160, 82, 45, 0.1) 0%,
              transparent 40%
            ),
            radial-gradient(
              ellipse 120% 80% at 70% 60%,
              rgba(139, 69, 19, 0.12) 0%,
              transparent 40%
            ),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 1px,
              rgba(139, 69, 19, 0.04) 1px,
              rgba(139, 69, 19, 0.04) 2px
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 2px,
              rgba(160, 82, 45, 0.03) 2px,
              rgba(160, 82, 45, 0.03) 3px
            ),
            radial-gradient(
              circle at 25% 35%,
              rgba(139, 69, 19, 0.08) 0%,
              transparent 3px
            ),
            radial-gradient(
              circle at 75% 65%,
              rgba(160, 82, 45, 0.06) 0%,
              transparent 3px
            )
          `,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 2px, 4px 100%, 4px 4px, 4px 4px',
          backgroundColor: '#f4e8d0', // Parchment color
          boxShadow: 'inset 0 0 20px rgba(139, 69, 19, 0.1), inset 0 0 40px rgba(139, 69, 19, 0.05)',
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
  
  // Get overlay effect styles
  const overlayEffect = appearance.overlayEffect || 'none'
  const titleTextEffect = appearance.titleTextEffect || 'none'
  const bodyTextEffect = appearance.bodyTextEffect || 'none'
  
  // Get text effect styles
  const getTextEffectStyle = (effect: string, baseColor?: string) => {
    switch (effect) {
      case 'etched':
        return {
          color: baseColor || '#000000',
          textShadow: '0 1px 0 rgba(255,255,255,0.5), 0 -1px 0 rgba(0,0,0,0.3), 1px 1px 0 rgba(0,0,0,0.2)',
        }
      case 'contoured':
        return {
          color: baseColor || '#000000',
          textShadow: '1px 1px 0 rgba(0,0,0,0.8), -1px -1px 0 rgba(255,255,255,0.5), 1px -1px 0 rgba(0,0,0,0.5), -1px 1px 0 rgba(0,0,0,0.5)',
        }
      case 'black':
        return {
          color: '#000000',
          textShadow: 'none',
        }
      case 'white':
        return {
          color: '#FFFFFF',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
        }
      case 'glow':
        return {
          color: baseColor || '#FFFFFF',
          textShadow: `0 0 10px ${baseColor || '#FFFFFF'}, 0 0 20px ${baseColor || '#FFFFFF'}, 0 0 30px ${baseColor || '#FFFFFF'}`,
        }
      case 'shadow':
        return {
          color: baseColor || '#000000',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5), 4px 4px 8px rgba(0,0,0,0.3)',
        }
      default:
        return {}
    }
  }
  
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
  
  // Check if this is the Blitzkrieg achievement for army camo theme
  const isBlitzkrieg = achievement.slug === "blitzkrieg" || achievement.name === "Blitzkrieg!" || achievement.name === "Blitzkrieg" || achievement.name === "BLITZKRIEG"
  
  // Hail Caesar achievement removed - always false
  const isHailCaesar = false
  
  // Check if this is the Doppelganger achievement for Spiderman theme
  const isDoppelganger = achievement.slug === "doppelganger" || achievement.name === "Doppelganger"
  
  // Check if this is the 95.5 ATAR achievement for NESA theme
  const isATAR = achievement.slug === "master-mind" || achievement.name === "95.5 ATAR" || achievement.name === "95.5 ATAR"
  
  // Check if this is the All Rounder achievement (same style as ATAR)
  const isAllRounder = achievement.slug === "all-rounder" || achievement.name === "All Rounder"
  
  // Check if achievement is in progress (has progress but not unlocked)
  // Or force show progress for preview/editor
  const hasProgress = progressValue !== undefined && progressMax !== undefined && progressValue > 0
  const isInProgress = forceShowProgress ? hasProgress : (!isUnlocked && hasProgress)
  const progressPercent = hasProgress && progressMax ? Math.min((progressValue / progressMax) * 100, 100) : 0

  const handleClick = () => {
    if (isLockedPremium && onUpgradeClick) {
      onUpgradeClick()
    }
  }

  // Entrance animation - simple fade and slide
  const getEntranceAnimation = () => {
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
          onMouseEnter={() => !disableFlip && (isUnlocked || isInProgress) && handleFlipChange(true)}
          onMouseLeave={() => !disableFlip && handleFlipChange(false)}
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
          scale: 1,
        }}
        transition={{
          rotateY: {
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          },
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
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            rotateY: 0,
            ...(isHailCaesar || isBlitzkrieg || isDoppelganger || isATAR || isAllRounder
              ? {
                  backgroundColor: isHailCaesar ? '#F5F5F0' : isBlitzkrieg ? '#4A5D23' : isDoppelganger ? '#1E3A8A' : '#003366',
                  backgroundImage: 'none',
                  backgroundSize: isHailCaesar ? 'cover' : undefined,
                  backgroundPosition: isHailCaesar ? 'center' : undefined,
                  backgroundBlendMode: isHailCaesar ? 'overlay' : undefined,
                }
              : achievement.appearance?.backgroundImage
              ? {
                  // Use rarity color as backgroundColor (ignore custom appearance.backgroundColor for standard material)
                  backgroundColor: (material === 'standard' 
                    ? (style.bgColor || '#9D9D9D')
                    : (achievement.appearance?.backgroundColor || style.bgColor || '#9D9D9D')),
                  backgroundImage: `url(${achievement.appearance.backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  ...(material !== 'standard' ? (() => {
                    const { backgroundColor, ...rest } = materialStyle;
                    return rest;
                  })() : {}),
                }
              : {
                  // CRITICAL: Ensure rarity colors are always visible for standard cards
                  // For standard material, always use rarity color directly (ignore custom backgroundColor)
                  // For non-standard materials, use materialStyle which includes background textures
                  // But still prefer rarity color as fallback if materialStyle doesn't have backgroundColor
                  ...(material === 'standard' 
                    ? {} // Don't spread anything, we'll set backgroundColor directly below
                    : materialStyle),
                  // Always prioritize rarity color for standard material
                  backgroundColor: material === 'standard' 
                    ? (style.bgColor || '#9D9D9D')
                    : (materialStyle.backgroundColor || style.bgColor || '#9D9D9D'),
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
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            </>
          )}

          {isNeon && (
            <>
              {/* Animated neon scan line (glow removed) */}
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
                  ease: [0.4, 0, 0.2, 1],
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


          {/* Premium Badge */}
          {achievement.isPremiumOnly && isUnlocked && (
            <div className="absolute top-3 right-3 z-20">
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-1.5 shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          )}

          {/* Border Effects - only for special card variants */}
          {isUnlocked && !isFoil && !isFoilGold && !isFoilSilver && !isPrismatic && !isNeon && !isHailCaesar && !isBlitzkrieg && !isDoppelganger && !isATAR && !isAllRounder && (
            <>
              {/* Border effects removed - using foil/special effects instead */}
            </>
          )}

          {/* Glow Effects */}
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
                    ease: [0.4, 0, 0.2, 1],
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
                    ease: [0.4, 0, 0.2, 1],
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


          {/* Card Content */}
          <div className="flex-1 flex flex-col p-3 sm:p-4 relative z-20 h-full min-h-0 justify-center">
            {/* Content above date - vertically centered */}
            <div className={cn(
              "flex flex-col flex-1 justify-center"
            )}>
              {/* Icon Section */}
              <div className={cn(
                "flex items-center justify-center mb-3"
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
              {isEditable && onTitleChange ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onTitleChange(e.currentTarget.textContent || '')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.currentTarget.blur()
                    }
                  }}
                  className={cn(
                    "font-bold mb-2 text-center outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 rounded px-1",
                    isHailCaesar ? "text-gray-900 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] font-bluu-next tracking-wide text-xl" : isBlitzkrieg ? "text-amber-400 font-black tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8),0_0_8px_rgba(255,165,0,0.5)] text-xl sm:text-2xl font-serif" : isDoppelganger ? "text-white font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8),0_0_8px_rgba(220,38,38,0.6)] text-sm sm:text-base font-backissues uppercase" : (isATAR || isAllRounder) ? "text-white font-sans tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-lg sm:text-xl" : "text-base",
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
                </div>
              ) : (
                <h3 className={cn(
                  "font-bold mb-2 text-center",
                  isHailCaesar ? "text-gray-900 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] font-bluu-next tracking-wide text-xl" : isBlitzkrieg ? "text-amber-400 font-black tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8),0_0_8px_rgba(255,165,0,0.5)] text-xl sm:text-2xl font-serif" : isDoppelganger ? "text-white font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8),0_0_8px_rgba(220,38,38,0.6)] text-sm sm:text-base font-backissues uppercase" : (isATAR || isAllRounder) ? "text-white font-sans tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-lg sm:text-xl" : "text-base",
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
              )}

              {/* Brief Description Preview */}
              {isEditable && onDescriptionChange ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onDescriptionChange(e.currentTarget.textContent || '')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      e.currentTarget.blur()
                    }
                  }}
                  className={cn(
                    "text-xs text-center outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 rounded px-1",
                    isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
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
                </div>
              ) : (
                <p className={cn(
                  "text-xs text-center",
                  isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
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
              )}
            </div>

            {/* Footer */}
            <div className="space-y-2 mt-auto">
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
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        isHailCaesar ? "from-gray-600 to-gray-700" : isBlitzkrieg ? "from-amber-500 to-amber-600" : isDoppelganger ? "from-red-500 to-red-600" : (isATAR || isAllRounder) ? "from-blue-500 to-blue-600" : "from-blue-400 to-blue-500",
                        "shadow-sm"
                      )}
                    />
                  </div>
                  <div className={cn(
                    "flex items-center justify-between text-xs",
                    isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
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
                <div className="space-y-1 relative z-20 flex flex-col items-center">
                  <div className={cn(
                    "w-3/4 h-1.5 rounded-full overflow-hidden",
                    isHailCaesar ? "bg-gray-300/40 backdrop-blur-sm" : isBlitzkrieg ? "bg-amber-900/40 backdrop-blur-sm" : isDoppelganger ? "bg-red-900/40 backdrop-blur-sm" : (isATAR || isAllRounder) ? "bg-blue-900/40 backdrop-blur-sm" : "bg-white/20 backdrop-blur-sm"
                  )}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "h-full rounded-full",
                        isHailCaesar ? "bg-gray-700/80 backdrop-blur-sm" : isBlitzkrieg ? "bg-amber-400/90 backdrop-blur-sm" : isDoppelganger ? "bg-red-500/90 backdrop-blur-sm" : (isATAR || isAllRounder) ? "bg-blue-400/90 backdrop-blur-sm" : "bg-white/80 backdrop-blur-sm",
                        "shadow-sm"
                      )}
                    />
                  </div>
                  <div className={cn(
                    "flex items-center justify-center text-xs",
                        isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
                    "opacity-90"
                  )}>
                    <span className="font-medium">
                      {progressValue} / {progressMax}
                    </span>
                  </div>
                </div>
              )}

              {/* Unlocked Date - Show on front instead of rarity */}
              {isUnlocked && unlockedAt && (
                <div className={cn(
                  "flex items-center justify-center gap-1.5 text-xs",
                      isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
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
                ease: [0.4, 0, 0.2, 1],
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
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
              rotateY: 180,
              ...(isHailCaesar || isBlitzkrieg || isDoppelganger || isATAR || isAllRounder
                ? {
                    backgroundColor: isHailCaesar ? '#F5F5F0' : isBlitzkrieg ? '#4A5D23' : isDoppelganger ? '#1E3A8A' : '#003366',
                    backgroundImage: 'none',
                    backgroundSize: isHailCaesar ? 'cover' : undefined,
                    backgroundPosition: isHailCaesar ? 'center' : undefined,
                    backgroundBlendMode: isHailCaesar ? 'overlay' : undefined,
                  }
                : achievement.appearance?.backgroundImage
                ? {
                    // Use rarity color as backgroundColor (ignore custom appearance.backgroundColor for standard material)
                    backgroundColor: (material === 'standard' 
                      ? (style.bgColor || '#9D9D9D')
                      : (achievement.appearance?.backgroundColor || style.bgColor || '#9D9D9D')),
                    backgroundImage: `url(${achievement.appearance.backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    ...(material !== 'standard' ? (() => {
                      const { backgroundColor, ...rest } = materialStyle;
                      return rest;
                    })() : {}),
                  }
                : {
                    // CRITICAL: Ensure rarity colors are always visible on the back of the card too
                    // For standard material, always use rarity color directly (ignore custom backgroundColor)
                    // For non-standard materials, use materialStyle which includes background textures
                    // But still prefer rarity color as fallback if materialStyle doesn't have backgroundColor
                    ...(material === 'standard' 
                      ? {} // Don't spread anything, we'll set backgroundColor directly below
                      : materialStyle),
                    // Always prioritize rarity color for standard material
                    backgroundColor: material === 'standard' 
                      ? (style.bgColor || '#9D9D9D')
                      : (materialStyle.backgroundColor || style.bgColor || '#9D9D9D'),
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
                        background: `linear-gradient(${style.bgColor}, ${style.bgColor}) padding-box, linear-gradient(135deg, rgba(192, 192, 192, 0.8), rgba(255, 255, 255, 0.9), rgba(192, 192, 192, 0.8)) border-box`,
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
                      ease: [0.4, 0, 0.2, 1],
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
                      ease: [0.4, 0, 0.2, 1],
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
                    ease: [0.4, 0, 0.2, 1],
                  }}
                />
              </>
            )}

            {isNeon && (
              <>
                {/* Animated neon scan line (glow removed) */}
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
                    ease: [0.4, 0, 0.2, 1],
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
                  isHailCaesar ? "text-gray-900 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] font-bluu-next tracking-wide text-2xl uppercase" : isBlitzkrieg ? "text-amber-400 font-black tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8),0_0_8px_rgba(255,165,0,0.5)] text-xl sm:text-2xl font-serif" : isDoppelganger ? "text-white font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8),0_0_8px_rgba(220,38,38,0.6)] text-base sm:text-lg font-backissues uppercase" : (isATAR || isAllRounder) ? "text-white font-sans tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-xl sm:text-2xl" : "text-lg",
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
                  isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
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
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        isHailCaesar ? "from-gray-600 to-gray-700" : isBlitzkrieg ? "from-amber-500 to-amber-600" : isDoppelganger ? "from-red-500 to-red-600" : (isATAR || isAllRounder) ? "from-blue-500 to-blue-600" : "from-blue-400 to-blue-500",
                        "shadow-sm"
                      )}
                    />
                  </div>
                  <div className={cn(
                    "flex items-center justify-center gap-2 text-sm",
                    isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
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
                <div className="space-y-1.5 pt-1 flex flex-col items-center">
                  <div className={cn(
                    "w-3/4 h-2 rounded-full overflow-hidden",
                    isHailCaesar ? "bg-gray-300/40 backdrop-blur-sm" : isBlitzkrieg ? "bg-amber-900/40 backdrop-blur-sm" : isDoppelganger ? "bg-red-900/40 backdrop-blur-sm" : (isATAR || isAllRounder) ? "bg-blue-900/40 backdrop-blur-sm" : "bg-white/20 backdrop-blur-sm"
                  )}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "h-full rounded-full",
                        isHailCaesar ? "bg-gray-700/80 backdrop-blur-sm" : isBlitzkrieg ? "bg-amber-400/90 backdrop-blur-sm" : isDoppelganger ? "bg-red-500/90 backdrop-blur-sm" : (isATAR || isAllRounder) ? "bg-blue-400/90 backdrop-blur-sm" : "bg-white/80 backdrop-blur-sm",
                        "shadow-sm"
                      )}
                    />
                  </div>
                  <div className={cn(
                    "flex items-center justify-center gap-2 text-sm",
                    isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
                    "opacity-90"
                  )}>
                    <span className="font-medium">
                      Progress: {progressValue} / {progressMax}
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
                    isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
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
                    isHailCaesar ? "text-gray-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" : isBlitzkrieg ? "text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : isDoppelganger ? "text-red-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : (isATAR || isAllRounder) ? "text-white font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : style.text,
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

