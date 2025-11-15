'use client';

import { motion } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';

interface StreakCardsProps {
  streaks: {
    currentQuestionStreak: number;
    bestQuestionStreak: number;
    currentQuizStreak: number;
    bestQuizStreak: number;
  };
}

export function StreakCards({ streaks }: StreakCardsProps) {
  // Slight rotation angles for each card (in degrees)
  const rotations = [-0.75, 0.5];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
      {/* Question Streak */}
      <motion.div
        initial={{ opacity: 0, x: -20, rotate: 0 }}
        animate={{ opacity: 1, x: 0, rotate: rotations[0] }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        whileHover={{ rotate: rotations[0] + (rotations[0] > 0 ? 0.5 : -0.5), scale: 1.02 }}
        className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800/50 p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Question Streak</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Consecutive correct answers</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-orange-600 dark:text-orange-400 mb-1">{streaks.currentQuestionStreak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Current streak</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-orange-600 dark:text-orange-400 mb-1">{streaks.bestQuestionStreak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Best streak</div>
          </div>
        </div>
      </motion.div>

      {/* Quiz Streak */}
      <motion.div
        initial={{ opacity: 0, x: 20, rotate: 0 }}
        animate={{ opacity: 1, x: 0, rotate: rotations[1] }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        whileHover={{ rotate: rotations[1] + (rotations[1] > 0 ? 0.5 : -0.5), scale: 1.02 }}
        className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800/50 p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quiz Streak</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Consecutive quizzes played</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">{streaks.currentQuizStreak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Current streak</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">{streaks.bestQuizStreak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Best streak</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

