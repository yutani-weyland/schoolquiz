'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Trophy, ArrowRight, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { AchievementCard } from '@/components/achievements/AchievementCard';
import { useUserTier } from '@/hooks/useUserTier';
import type { UserTier } from '@/lib/feature-gating';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  achievementId: string;
  achievementSlug: string;
  achievementName: string;
  achievementDescription: string;
  achievementRarity: string;
  achievementCategory: string;
  achievementIconKey?: string | null;
  quizSlug?: string | null;
  progressValue?: number;
  progressMax?: number;
  unlockedAt: string;
  meta?: any;
}

// Mock achievements for prototyping/testing
const getMockAchievements = (): Achievement[] => {
  return [
    {
      id: 'mock-1',
      achievementId: 'mock-1',
      achievementSlug: 'ace',
      achievementName: 'ACE',
      achievementDescription: 'Get a perfect score',
      achievementRarity: 'common',
      achievementCategory: 'performance',
      achievementIconKey: '/achievements/ace.png',
      quizSlug: '10',
      unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-2',
      achievementId: 'mock-2',
      achievementSlug: 'addicted-shiny',
      achievementName: 'Addicted',
      achievementDescription: 'Play 3 quizzes in a single day',
      achievementRarity: 'uncommon',
      achievementCategory: 'engagement',
      achievementIconKey: '🔥',
      quizSlug: null,
      unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-3',
      achievementId: 'mock-3',
      achievementSlug: 'perfect-fullart',
      achievementName: 'Perfect Quiz',
      achievementDescription: 'Get all questions correct',
      achievementRarity: 'epic',
      achievementCategory: 'performance',
      achievementIconKey: '💯',
      quizSlug: '15',
      unlockedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-4',
      achievementId: 'mock-4',
      achievementSlug: 'streak-master',
      achievementName: 'Streak Master',
      achievementDescription: 'Maintain a 7-day quiz streak',
      achievementRarity: 'rare',
      achievementCategory: 'engagement',
      achievementIconKey: '⚡',
      quizSlug: null,
      unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-5',
      achievementId: 'mock-5',
      achievementSlug: 'quick-thinker',
      achievementName: 'Quick Thinker',
      achievementDescription: 'Complete a quiz in under 2 minutes',
      achievementRarity: 'uncommon',
      achievementCategory: 'performance',
      achievementIconKey: '⚡',
      quizSlug: '12',
      unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-6',
      achievementId: 'mock-6',
      achievementSlug: 'golden-champion',
      achievementName: 'Golden Champion',
      achievementDescription: 'Achieve legendary status',
      achievementRarity: 'legendary',
      achievementCategory: 'performance',
      achievementIconKey: '👑',
      quizSlug: null,
      unlockedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-7',
      achievementId: 'mock-7',
      achievementSlug: 'all-rounder',
      achievementName: 'All Rounder',
      achievementDescription: 'Get a perfect score in 4 or more round types',
      achievementRarity: 'epic',
      achievementCategory: 'performance',
      achievementIconKey: '⭐',
      quizSlug: null,
      unlockedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-8',
      achievementId: 'mock-8',
      achievementSlug: 'blitzkrieg',
      achievementName: 'Blitzkrieg',
      achievementDescription: 'Finish a History round under 2 minutes',
      achievementRarity: 'uncommon',
      achievementCategory: 'performance',
      achievementIconKey: '⚡',
      quizSlug: '12',
      unlockedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-9',
      achievementId: 'mock-9',
      achievementSlug: 'category-expert',
      achievementName: 'Category Expert',
      achievementDescription: 'Score 100% in 5 different categories',
      achievementRarity: 'rare',
      achievementCategory: 'performance',
      achievementIconKey: '🎯',
      quizSlug: null,
      unlockedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-10',
      achievementId: 'mock-10',
      achievementSlug: 'routine-genius',
      achievementName: 'Routine Genius',
      achievementDescription: 'Play for 4 consecutive weeks',
      achievementRarity: 'uncommon',
      achievementCategory: 'engagement',
      achievementIconKey: '📅',
      quizSlug: null,
      unlockedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
};

interface AllAchievement {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription?: string;
  category: string;
  rarity: string;
  isPremiumOnly: boolean;
  seasonTag?: string | null;
  iconKey?: string | null;
  series?: string | null;
  cardVariant?: 'standard' | 'foil' | 'foilGold' | 'foilSilver' | 'shiny' | 'fullArt';
  status: 'unlocked' | 'locked_free' | 'locked_premium';
  unlockedAt?: string;
  quizSlug?: string | null;
  progressValue?: number;
  progressMax?: number;
}

export function RecentAchievements() {
  const { data: session } = useSession();
  const { tier: hookTier } = useUserTier();
  // Map hook tier ('basic' | 'premium') to feature-gating tier ('visitor' | 'free' | 'premium')
  const tier: UserTier = hookTier === 'premium' ? 'premium' : 'free';
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [inProgressAchievements, setInProgressAchievements] = useState<AllAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      // Use mock achievements for prototyping
      setRecentAchievements(getMockAchievements());
      return;
    }

    // Defer fetching to avoid blocking initial page load
    const timeoutId = setTimeout(async () => {
      try {
        if (!session?.user?.id) {
          setIsLoading(false);
          return;
        }
        // OPTIMIZATION: Fetch both in parallel instead of sequentially (saves ~50% load time)
        const { fetchUserAchievements, fetchAchievements } = await import('@/lib/achievement-fetch');
        
        // Fetch recent unlocked achievements AND all achievements in parallel
        const [userData, allData] = await Promise.all([
          fetchUserAchievements(session.user.id, null),
          fetchAchievements(session.user.id, null),
        ]);
        
        const fetchedAchievements = userData.achievements || [];
        // If no achievements, use mock data for prototyping
        if (fetchedAchievements.length === 0) {
          setRecentAchievements(getMockAchievements());
        } else {
          // Get the most recent 10 achievements
          setRecentAchievements(fetchedAchievements.slice(0, 10));
        }
        // Filter for in-progress achievements (have progress but not unlocked)
        const inProgress = (allData.achievements || []).filter((achievement: AllAchievement) => {
          const hasProgress = achievement.progressValue !== undefined && 
                            achievement.progressValue !== null &&
                            achievement.progressMax !== undefined && 
                            achievement.progressMax !== null;
          const isInProgress = hasProgress &&
                            (achievement.progressValue ?? 0) > 0 &&
                            (achievement.progressValue ?? 0) < (achievement.progressMax ?? 0) &&
                            achievement.status !== 'unlocked';
          return isInProgress;
        });

        // Sort by progress percentage (highest first)
        inProgress.sort((a: AllAchievement, b: AllAchievement) => {
          const percentA = a.progressMax ? (a.progressValue || 0) / a.progressMax : 0;
          const percentB = b.progressMax ? (b.progressValue || 0) / b.progressMax : 0;
          return percentB - percentA;
        });

        // Add test achievement with progress
        const progressTestAchievement: AllAchievement = {
          id: "test-progress-1",
          slug: "quiz-master-progress",
          name: "Quiz Master",
          shortDescription: "Complete 10 quizzes",
          longDescription: "Show your dedication by completing 10 quizzes. You're making great progress!",
          category: "engagement",
          rarity: "uncommon",
          isPremiumOnly: false,
          cardVariant: "standard",
          status: "locked_free",
          progressValue: 7,
          progressMax: 10,
        };

        setInProgressAchievements([...inProgress, progressTestAchievement].slice(0, 6));
      } catch (error) {
        console.error('Error fetching achievements:', error);
        // Use mock achievements on error for prototyping
        setRecentAchievements(getMockAchievements());
      } finally {
        setIsLoading(false);
      }
    }, 100); // Defer by 100ms to avoid blocking initial render

    return () => clearTimeout(timeoutId);
  }, []);

  if (finalIsLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-8"
      >
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (finalRecentAchievements.length === 0 && finalInProgressAchievements.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-8"
    >
      {/* Recent Achievements Section */}
      {finalRecentAchievements.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Achievements</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your latest unlocked achievements</p>
              </div>
            </div>
            <Link
              href="/achievements"
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors text-sm font-medium shadow-sm hover:shadow-md"
            >
              View All Achievements
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Scrolling Achievements Container */}
          <div className="overflow-hidden pb-4 -mx-2 px-2 relative mb-8">
            <motion.div 
              className="flex gap-4 min-w-max"
              animate={{
                x: [0, -(180 + 16) * finalRecentAchievements.length],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 80,
                  ease: "linear",
                },
              }}
            >
              {/* Duplicate cards for seamless loop */}
              {[...finalRecentAchievements, ...finalRecentAchievements, ...finalRecentAchievements].map((achievement, index) => {
                // Slight rotation angles for each card
                const rotations = [-0.5, 0.75, -0.75, 0.5, -1, 0.5, -0.5, 1, -0.75, 0.5];
                const rotation = rotations[index % rotations.length] || 0;

                return (
                  <motion.div
                    key={`${achievement.id}-${index}`}
                    initial={{ opacity: 0, y: 10, rotate: 0 }}
                    animate={{ opacity: 1, y: 0, rotate: rotation }}
                        transition={{ delay: (index % finalRecentAchievements.length) * 0.05, type: 'spring', stiffness: 200, damping: 15 }}
                    whileHover={{ rotate: rotation + (rotation > 0 ? 0.5 : -0.5), scale: 1.05 }}
                    className="flex-shrink-0 w-[180px] sm:w-[190px]"
                  >
                    <div className="scale-[0.85] sm:scale-[0.9] origin-left">
                      <AchievementCard
                      achievement={{
                        id: achievement.achievementId,
                        slug: achievement.achievementSlug,
                        name: achievement.achievementName,
                        shortDescription: achievement.achievementDescription,
                        category: achievement.achievementCategory,
                        rarity: achievement.achievementRarity,
                        isPremiumOnly: false,
                        iconKey: achievement.achievementIconKey,
                        // Add card variants for visual variety
                        cardVariant: 
                          achievement.achievementSlug === 'ace' ? 'foil' :
                          achievement.achievementSlug === 'addicted-shiny' ? 'shiny' :
                          achievement.achievementSlug === 'perfect-fullart' ? 'fullArt' :
                          achievement.achievementSlug === 'golden-champion' ? 'foilGold' :
                          achievement.achievementSlug === 'silver-star' ? 'foilSilver' :
                          'standard',
                      }}
                      status="unlocked"
                      unlockedAt={achievement.unlockedAt}
                      quizSlug={achievement.quizSlug}
                      progressValue={achievement.progressValue}
                      progressMax={achievement.progressMax}
                      tier={tier}
                    />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </>
      )}

      {/* In Progress Section */}
      {finalInProgressAchievements.length > 0 && (
        <>
          <div className={cn(finalRecentAchievements.length > 0 && "border-t border-gray-200 dark:border-gray-700 pt-6 mt-6")}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">In Progress</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Achievements you're working towards
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{finalInProgressAchievements.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">achievements</div>
              </div>
            </div>

            {/* In Progress Achievements Grid */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {finalInProgressAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 15 }}
                  className="flex justify-center"
                  style={{
                    width: 'clamp(120px, 25vw, 200px)',
                    maxWidth: '200px',
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
            </div>

            {/* Progress Summary */}
            {finalInProgressAchievements.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    {Math.round(
                      (finalInProgressAchievements.reduce((sum, a) => {
                        const percent = a.progressMax ? (a.progressValue || 0) / a.progressMax : 0;
                        return sum + percent;
                      }, 0) / finalInProgressAchievements.length) * 100
                    )}% average progress across all achievements
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

