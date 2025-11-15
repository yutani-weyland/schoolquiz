'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { ACHIEVEMENT_MAP, AchievementKey } from '@/components/quiz/achievements';
import { cn } from '@/lib/utils';

interface TrophyCabinetProps {
  achievements: Array<{
    id: string;
    achievementKey: string;
    quizSlug: string | null;
    metadata: string | null;
    unlockedAt: string;
  }>;
  colorScheme?: string;
}

export function TrophyCabinet({ achievements, colorScheme = 'blue' }: TrophyCabinetProps) {
  const colorClasses: Record<string, { bg: string; border: string }> = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      border: 'border-blue-200 dark:border-blue-800/50',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/10',
      border: 'border-purple-200 dark:border-purple-800/50',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/10',
      border: 'border-green-200 dark:border-green-800/50',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/10',
      border: 'border-orange-200 dark:border-orange-800/50',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/10',
      border: 'border-red-200 dark:border-red-800/50',
    },
    pink: {
      bg: 'bg-pink-50 dark:bg-pink-900/10',
      border: 'border-pink-200 dark:border-pink-800/50',
    },
  };

  const colors = colorClasses[colorScheme] || colorClasses.blue;

  if (achievements.length === 0) {
    return (
      <div className={`${colors.bg} ${colors.border} border rounded-xl p-8 text-center`}>
        <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          No achievements yet
        </p>
      </div>
    );
  }

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-6`}>
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Achievements
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({achievements.length})
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement, index) => {
          const achievementDef = ACHIEVEMENT_MAP[achievement.achievementKey as AchievementKey];
          if (!achievementDef) return null;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <div
                className={`
                  bg-white dark:bg-gray-800 rounded-lg p-3 
                  border border-gray-200 dark:border-gray-700
                  transition-all duration-200 hover:shadow-md cursor-pointer
                `}
                title={`${achievementDef.name}: ${achievementDef.description}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: achievementDef.iconColor + '15' }}
                  >
                    {achievementDef.icon}
                  </div>
                  <div className="text-center">
                    <h4 className={cn(
                      "font-semibold text-xs text-gray-900 dark:text-white mb-0.5 line-clamp-1",
                      achievementDef.name === "Hail Caesar" && "font-bluu-next tracking-wide"
                    )}>
                      {achievementDef.name}
                    </h4>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {new Date(achievement.unlockedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

