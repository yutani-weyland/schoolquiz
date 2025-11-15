'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Search, Sparkles } from 'lucide-react';
import { ACHIEVEMENT_MAP, AchievementKey, ACHIEVEMENT_DEFINITIONS } from '@/components/quiz/achievements';
import { cn } from '@/lib/utils';

interface AchievementBrowserProps {
  unlockedAchievements: Array<{
    id: string;
    achievementKey: string;
  }>;
  colorScheme?: string;
}

// Extended achievement definitions with hidden achievements and clues
interface ExtendedAchievement {
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  rarity: number;
  artworkSrc?: string;
  artworkAlt?: string;
  isHidden: boolean;
  clue: string | null;
  achievementKey: string;
}

const ALL_ACHIEVEMENTS: ExtendedAchievement[] = [
  // Map existing achievements with their keys
  {
    ...ACHIEVEMENT_DEFINITIONS[0],
    isHidden: false,
    clue: null,
    achievementKey: 'hail_caesar',
  },
  {
    ...ACHIEVEMENT_DEFINITIONS[1],
    isHidden: false,
    clue: null,
    achievementKey: 'the_hook',
  },
  {
    ...ACHIEVEMENT_DEFINITIONS[2],
    isHidden: false,
    clue: null,
    achievementKey: 'ace',
  },
  {
    ...ACHIEVEMENT_DEFINITIONS[3],
    isHidden: false,
    clue: null,
    achievementKey: 'unstoppable',
  },
  {
    ...ACHIEVEMENT_DEFINITIONS[4],
    isHidden: false,
    clue: null,
    achievementKey: 'flashback',
  },
  // Hidden achievements with clues
  {
    name: "???",
    description: "Hidden Achievement",
    icon: "🔒",
    iconColor: "#6B7280",
    rarity: 0, // Will be revealed when unlocked
    isHidden: true,
    clue: "Master the art of perfect timing",
    achievementKey: "speed_master",
  },
  {
    name: "???",
    description: "Hidden Achievement",
    icon: "🔒",
    iconColor: "#6B7280",
    rarity: 0,
    isHidden: true,
    clue: "Answer correctly without hesitation",
    achievementKey: "quick_draw",
  },
  {
    name: "???",
    description: "Hidden Achievement",
    icon: "🔒",
    iconColor: "#6B7280",
    rarity: 0,
    isHidden: true,
    clue: "Complete a quiz in record time",
    achievementKey: "lightning_round",
  },
];

// Get rarity tier name
function getRarityTier(rarity: number): { name: string; color: string; bgColor: string } {
  if (rarity <= 3) {
    return { name: 'Legendary', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' };
  } else if (rarity <= 5) {
    return { name: 'Epic', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20' };
  } else if (rarity <= 8) {
    return { name: 'Rare', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' };
  } else if (rarity <= 12) {
    return { name: 'Uncommon', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' };
  } else {
    return { name: 'Common', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-800' };
  }
}

// Get background color based on rarity
function getRarityBackground(rarity: number): string {
  if (rarity <= 3) {
    return 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20';
  } else if (rarity <= 5) {
    return 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20';
  } else if (rarity <= 8) {
    return 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20';
  } else if (rarity <= 12) {
    return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20';
  } else {
    return 'bg-white dark:bg-gray-800';
  }
}

export function AchievementBrowser({ unlockedAchievements, colorScheme = 'blue' }: AchievementBrowserProps) {
  const unlockedKeys = new Set(unlockedAchievements.map(a => a.achievementKey));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState<string | null>(null);

  // Filter achievements
  const filteredAchievements = ALL_ACHIEVEMENTS.filter(ach => {
    const matchesSearch = ach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (!ach.isHidden && ach.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ach.isHidden && ach.clue?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRarity = !filterRarity || getRarityTier(ach.rarity || 0).name === filterRarity;
    
    return matchesSearch && matchesRarity;
  });

  // Group by unlocked/hidden
  const unlocked = filteredAchievements.filter(ach => unlockedKeys.has(ach.achievementKey));
  const locked = filteredAchievements.filter(ach => !unlockedKeys.has(ach.achievementKey));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
            Achievement Browser
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Discover all achievements and their secrets
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-full shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            Premium
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterRarity || ''}
          onChange={(e) => setFilterRarity(e.target.value || null)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Rarities</option>
          <option value="Legendary">Legendary</option>
          <option value="Epic">Epic</option>
          <option value="Rare">Rare</option>
          <option value="Uncommon">Uncommon</option>
          <option value="Common">Common</option>
        </select>
      </div>

      {/* Unlocked Achievements */}
      {unlocked.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Unlocked ({unlocked.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map((achievement, index) => {
              const rarityTier = getRarityTier(achievement.rarity || 0);
              const achievementDef = ACHIEVEMENT_MAP[achievement.achievementKey as AchievementKey];

              return (
                <motion.div
                  key={achievement.achievementKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    relative ${getRarityBackground(achievement.rarity || 0)} rounded-3xl p-5 
                    border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-md transition-all
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md overflow-hidden bg-white dark:bg-gray-800">
                        {achievementDef?.artworkSrc ? (
                          <img
                            src={achievementDef.artworkSrc}
                            alt={achievementDef.artworkAlt || achievement.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">{achievementDef?.icon || achievement.icon}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                          {achievementDef?.name || achievement.name}
                        </h4>
                        <span className={`
                          text-xs font-semibold px-2 py-0.5 rounded-full ${rarityTier.bgColor} ${rarityTier.color}
                        `}>
                          {achievement.rarity || 0}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {achievementDef?.description || achievement.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${rarityTier.bgColor} ${rarityTier.color}`}>
                          {rarityTier.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {locked.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            Locked ({locked.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map((achievement, index) => {
              const isHidden = achievement.isHidden;
              const rarityTier = getRarityTier(achievement.rarity || 0);

              return (
                <motion.div
                  key={achievement.achievementKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (unlocked.length + index) * 0.05 }}
                  className={`
                    relative bg-gray-100 dark:bg-gray-800 rounded-3xl p-5 
                    border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all
                    ${isHidden ? 'opacity-75' : ''}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md bg-gray-200 dark:bg-gray-700">
                        {isHidden ? (
                          <Lock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <span className="text-3xl opacity-50">{achievement.icon}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={cn(
                          "font-semibold text-sm text-gray-900 dark:text-white",
                          !isHidden && achievement.name === "Hail Caesar" && "font-bluu-next tracking-wide"
                        )}>
                          {isHidden ? '???' : achievement.name}
                        </h4>
                        {!isHidden && achievement.rarity > 0 && (
                          <span className={`
                            text-xs font-semibold px-2 py-0.5 rounded-full ${rarityTier.bgColor} ${rarityTier.color}
                          `}>
                            {achievement.rarity}%
                          </span>
                        )}
                      </div>
                      {isHidden ? (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            {achievement.clue}
                          </p>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            Hidden Achievement
                          </span>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2 opacity-75">
                            {achievement.description}
                          </p>
                          {achievement.rarity > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${rarityTier.bgColor} ${rarityTier.color}`}>
                              {rarityTier.name}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No achievements found matching your search
          </p>
        </div>
      )}
    </div>
  );
}

