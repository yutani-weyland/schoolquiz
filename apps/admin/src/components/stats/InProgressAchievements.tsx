'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Target, TrendingUp } from 'lucide-react';
import { AchievementCard } from '@/components/achievements/AchievementCard';
import { useUserTier } from '@/hooks/useUserTier';
import type { UserTier } from '@/lib/feature-gating';

interface Achievement {
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

export function InProgressAchievements() {
  const { data: session } = useSession();
  const { tier } = useUserTier();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    // Defer fetching to avoid blocking initial page load
      const timeoutId = setTimeout(() => {
      const fetchAchievements = async () => {
        try {
          if (!session?.user?.id) {
            setIsLoading(false);
            return;
          }
          // Use shared fetch utility with automatic deduplication
          const { fetchAchievements } = await import('@/lib/achievement-fetch');
        
        const data = await fetchAchievements(session.user.id, null);
        
        // Filter for in-progress achievements (have progress but not unlocked)
        const inProgressAchievements = data.achievements.filter((achievement: Achievement) => {
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
        inProgressAchievements.sort((a: Achievement, b: Achievement) => {
          const percentA = a.progressMax ? (a.progressValue || 0) / a.progressMax : 0;
          const percentB = b.progressMax ? (b.progressValue || 0) / b.progressMax : 0;
          return percentB - percentA;
        });

        setAchievements(inProgressAchievements);
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
    }, 100); // Defer by 100ms to avoid blocking initial render

    return () => clearTimeout(timeoutId);
  }, []);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-8"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading achievements...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (achievements.length === 0) {
    return null; // Don't show the card if there are no in-progress achievements
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-8"
    >
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
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{achievements.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">achievements</div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
        {achievements.map((achievement, index) => (
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
              tier={tier as UserTier}
            />
          </motion.div>
        ))}
      </div>

      {/* Progress Summary */}
      {achievements.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>
              {Math.round(
                (achievements.reduce((sum, a) => {
                  const percent = a.progressMax ? (a.progressValue || 0) / a.progressMax : 0;
                  return sum + percent;
                }, 0) / achievements.length) * 100
              )}% average progress across all achievements
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

