'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, GripVertical, BookOpen, X, Lock } from 'lucide-react';
import { ACHIEVEMENT_MAP, AchievementKey } from '@/components/quiz/achievements';
import { AchievementBrowser } from './AchievementBrowser';
import { useUserTier } from '@/hooks/useUserTier';
import { cn } from '@/lib/utils';

interface AchievementsShowcaseProps {
  achievements: Array<{
    id: string;
    achievementKey: string;
    quizSlug: string | null;
    metadata: string | null;
    unlockedAt: string;
  }>;
  colorScheme?: string;
  isOwnProfile?: boolean;
  isPremium?: boolean;
  onUpdate?: () => void;
}

export function AchievementsShowcase({ 
  achievements, 
  colorScheme = 'blue',
  isOwnProfile = false,
  isPremium: propIsPremium = false,
  onUpdate
}: AchievementsShowcaseProps) {
  const { isPremium: hookIsPremium } = useUserTier();
  const effectiveIsPremium = propIsPremium || hookIsPremium;
  const [orderedAchievements, setOrderedAchievements] = useState(achievements);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Load saved order from localStorage
  useEffect(() => {
    if (isOwnProfile && effectiveIsPremium && typeof window !== 'undefined') {
      const savedOrder = localStorage.getItem('achievement-order');
      if (savedOrder) {
        try {
          const order = JSON.parse(savedOrder);
          // Reorder achievements based on saved order
          const ordered = [...achievements].sort((a, b) => {
            const aIndex = order.indexOf(a.id);
            const bIndex = order.indexOf(b.id);
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
          });
          setOrderedAchievements(ordered);
        } catch (e) {
          console.error('Failed to load achievement order:', e);
          setOrderedAchievements(achievements);
        }
      } else {
        setOrderedAchievements(achievements);
      }
    } else {
      setOrderedAchievements(achievements);
    }
  }, [achievements, isOwnProfile, effectiveIsPremium]);

  // Auto-save order to localStorage and API
  const saveOrder = useCallback(async (newOrder: typeof achievements) => {
    if (!isOwnProfile || !effectiveIsPremium) return;

    // Save to localStorage immediately
    const order = newOrder.map(a => a.id);
    localStorage.setItem('achievement-order', JSON.stringify(order));

    // Debounce API call
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        await fetch('/api/user/achievements/order', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order }),
        });

        if (onUpdate) {
          onUpdate();
        }
      } catch (error) {
        console.error('Failed to save achievement order:', error);
      }
    }, 500); // 500ms debounce

    setSaveTimeout(timeout);
  }, [isOwnProfile, effectiveIsPremium, saveTimeout, onUpdate]);

  const handleDragStart = (index: number) => {
    if (!isOwnProfile || !effectiveIsPremium) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isOwnProfile || !effectiveIsPremium) return;
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (!isOwnProfile || !effectiveIsPremium || draggedIndex === null) return;
    e.preventDefault();

    const newOrder = [...orderedAchievements];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    setOrderedAchievements(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
    saveOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Get background color based on rarity
  const getRarityBackground = (rarity: number): string => {
    // Lower rarity = more rare = more special colors
    if (rarity <= 3) {
      // Legendary (1-3%) - Gold/Yellow
      return 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/40 dark:to-amber-900/40 dark:border dark:border-yellow-700/50';
    } else if (rarity <= 5) {
      // Epic (4-5%) - Purple
      return 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/40 dark:to-violet-900/40 dark:border dark:border-purple-700/50';
    } else if (rarity <= 8) {
      // Rare (6-8%) - Blue
      return 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/40 dark:border dark:border-blue-700/50';
    } else if (rarity <= 12) {
      // Uncommon (9-12%) - Green
      return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40 dark:border dark:border-green-700/50';
    } else {
      // Common (13%+) - Neutral gray with border
      return 'bg-white dark:bg-gray-800 dark:border dark:border-gray-700';
    }
  };

  // Get text color based on rarity background
  const getRarityTextColor = (rarity: number): string => {
    if (rarity <= 3) {
      return 'text-yellow-900 dark:text-yellow-100';
    } else if (rarity <= 5) {
      return 'text-purple-900 dark:text-purple-100';
    } else if (rarity <= 8) {
      return 'text-blue-900 dark:text-blue-100';
    } else if (rarity <= 12) {
      return 'text-green-900 dark:text-green-100';
    } else {
      return 'text-gray-900 dark:text-gray-100';
    }
  };

  // Get description text color (slightly muted but still readable)
  const getRarityDescriptionColor = (rarity: number): string => {
    if (rarity <= 3) {
      return 'text-yellow-800 dark:text-yellow-200';
    } else if (rarity <= 5) {
      return 'text-purple-800 dark:text-purple-200';
    } else if (rarity <= 8) {
      return 'text-blue-800 dark:text-blue-200';
    } else if (rarity <= 12) {
      return 'text-green-800 dark:text-green-200';
    } else {
      return 'text-gray-700 dark:text-gray-300';
    }
  };

  if (achievements.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-16 text-center min-h-[400px] flex flex-col items-center justify-center shadow-sm">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        </motion.div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          No achievements yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md text-sm">
          Complete quizzes to unlock achievements and build your collection!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
            Achievement Collection
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {achievements.length} {achievements.length === 1 ? 'achievement' : 'achievements'} unlocked
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => setShowBrowser(true)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse All</span>
          </motion.button>
        </div>
      </div>

      {/* Achievements Grid - Rectangular Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orderedAchievements.map((achievement, index) => {
          const achievementDef = ACHIEVEMENT_MAP[achievement.achievementKey as AchievementKey];
          if (!achievementDef) return null;

          const isDragged = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ 
                opacity: isDragged ? 0.5 : 1, 
                y: 0, 
                scale: isDragged ? 0.95 : 1, // Don't override inner hover scale
                zIndex: isDragged ? 50 : 1,
              }}
              transition={{ delay: index * 0.03, type: 'spring', stiffness: 200, damping: 20 }}
              className="group"
              draggable={isOwnProfile && effectiveIsPremium}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onDragLeave={() => setDragOverIndex(null)}
            >
                <motion.div
                className={`
                  relative ${getRarityBackground(achievementDef.rarity)} rounded-3xl p-5 
                  ${isOwnProfile && effectiveIsPremium ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                  flex items-center gap-4 shadow-lg dark:shadow-lg overflow-hidden
                  ${isDragOver ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''}
                  ${!effectiveIsPremium && isOwnProfile ? 'opacity-50 grayscale' : ''}
                `}
                title={!effectiveIsPremium && isOwnProfile ? 'Unlock with Premium' : `${achievementDef.name}: ${achievementDef.description}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                whileHover={{ 
                  rotate: 1.4,
                  scale: 1.02,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
                style={{ transformOrigin: 'center' }}
              >
                {/* Subtle gradient overlay on hover - matching quiz cards exactly */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 pointer-events-none rounded-3xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Lock Icon - Basic Users */}
                {!effectiveIsPremium && isOwnProfile && (
                  <div className="absolute top-3 right-3 z-10">
                    <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                
                {/* Drag Handle - Premium Only */}
                {isOwnProfile && effectiveIsPremium && (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                
                {/* Achievement Icon */}
                <div className="flex-shrink-0 relative z-10">
                  <div
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-110 overflow-hidden ${
                      achievementDef.artworkSrc ? '' : 'text-3xl'
                    }`}
                    style={{ 
                      backgroundColor: achievementDef.artworkSrc ? undefined : achievementDef.iconColor + '15' 
                    }}
                  >
                    {achievementDef.artworkSrc ? (
                      <img
                        src={achievementDef.artworkSrc}
                        alt={achievementDef.artworkAlt ?? `${achievementDef.name} badge artwork`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span role="img" aria-label={achievementDef.name}>
                        {achievementDef.icon}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Achievement Info */}
                <div className="flex-1 min-w-0 relative z-10">
                  <h3 className={cn(
                    "font-semibold text-sm mb-1 line-clamp-1",
                    getRarityTextColor(achievementDef.rarity),
                    achievementDef.name === "Hail Caesar" && "font-bluu-next tracking-wide"
                  )}>
                    {achievementDef.name}
                  </h3>
                  <p className={`text-xs ${getRarityDescriptionColor(achievementDef.rarity)} line-clamp-2 leading-tight mb-2`}>
                    {achievementDef.description}
                  </p>
                  
                  {/* Metadata */}
                  <div className={`flex items-center justify-between text-xs ${getRarityDescriptionColor(achievementDef.rarity)} pt-2 border-t ${achievementDef.rarity <= 12 ? 'border-current/20 dark:border-current/30' : 'border-gray-100 dark:border-gray-700'}`}>
                    <span className="truncate">
                      {new Date(achievement.unlockedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <span className={`font-semibold ml-2 ${
                      achievementDef.rarity <= 3 ? 'text-yellow-600 dark:text-yellow-400' :
                      achievementDef.rarity <= 5 ? 'text-purple-600 dark:text-purple-400' :
                      achievementDef.rarity <= 8 ? 'text-blue-600 dark:text-blue-400' :
                      achievementDef.rarity <= 12 ? 'text-green-600 dark:text-green-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {achievementDef.rarity}%
                    </span>
                  </div>
                </div>

                {/* Subtle shine effect on hover */}
                <motion.div 
                  className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.7, ease: 'easeInOut' }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Achievement Browser Modal */}
      <AnimatePresence>
        {showBrowser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowBrowser(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div 
                className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Achievement Browser
                  </h2>
                  <motion.button
                    onClick={() => setShowBrowser(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </motion.button>
                </div>
                
                {/* Modal Content */}
                <div className="overflow-y-auto flex-1 p-6">
                  <AchievementBrowser
                    unlockedAchievements={achievements}
                    colorScheme={colorScheme}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

