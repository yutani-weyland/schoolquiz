'use client';

import { motion } from 'framer-motion';
import { Flame, Check } from 'lucide-react';

interface StreakCalendarProps {
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastQuizDate: string | null;
    streakStartDate: string | null;
  };
  recentCompletions: Array<{
    quizSlug: string;
    completedAt: string;
  }>;
  colorScheme?: string;
}

export function StreakCalendar({ streak, recentCompletions, colorScheme = 'blue' }: StreakCalendarProps) {
  // Get current week (Monday to Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  // Get days of current week
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const currentWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      date,
      label: weekDays[i],
      isToday: date.toDateString() === today.toDateString(),
      isPast: date < today,
      isFuture: date > today,
    };
  });

  // Create a map of completion dates
  const completionDates = new Set(
    recentCompletions.map(c => {
      const date = new Date(c.completedAt);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    })
  );

  // Check each day in current week
  const weekStatus = currentWeek.map(day => {
    const dateStr = day.date.toISOString().split('T')[0];
    const hasCompletion = completionDates.has(dateStr);
    
    // Determine status: completed, missed (past without completion), or upcoming
    let status: 'completed' | 'missed' | 'upcoming' | 'today';
    if (hasCompletion) {
      status = 'completed';
    } else if (day.isPast && !day.isToday) {
      status = 'missed';
    } else if (day.isToday) {
      status = 'today';
    } else {
      status = 'upcoming';
    }

    return {
      ...day,
      status,
      hasCompletion,
    };
  });

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    pink: 'bg-pink-500',
  };

  const accentColor = colorClasses[colorScheme] || colorClasses.blue;

  return (
    <div className="space-y-8">
      {/* Week Streak Header */}
      <div className="text-center">
        <div className="flex items-baseline justify-center gap-2 mb-2">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-6xl font-bold text-gray-900 dark:text-white"
          >
            {streak.currentStreak}
          </motion.span>
          <span className="text-xl text-gray-600 dark:text-gray-400 font-medium">weeks</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Current streak • Best: {streak.longestStreak} weeks
        </p>
      </div>

      {/* Current Week Tracker */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            This Week
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Week Streak</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          {weekStatus.map((day, index) => {
            const isCompleted = day.status === 'completed';
            const isMissed = day.status === 'missed';
            const isToday = day.status === 'today';
            const isUpcoming = day.status === 'upcoming';

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 15 }}
                className="flex flex-col items-center gap-2 flex-1"
              >
                <div
                  className={`
                    w-full aspect-square rounded-2xl flex items-center justify-center
                    transition-all duration-200 relative
                    ${
                      isCompleted
                        ? `${accentColor} shadow-md`
                        : isMissed
                        ? 'bg-red-500 dark:bg-red-600'
                        : isToday
                        ? 'bg-gray-200 dark:bg-gray-700 border-2 border-blue-500'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }
                  `}
                  title={`${day.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}`}
                >
                  {isCompleted && (
                    <Flame className="w-6 h-6 text-white" strokeWidth={2.5} />
                  )}
                  {isMissed && (
                    <div className="w-2 h-2 rounded-full bg-white/80" />
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  isToday 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {day.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
