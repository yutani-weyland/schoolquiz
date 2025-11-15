'use client';

import { motion } from 'framer-motion';
import { Check, Flame } from 'lucide-react';
import Link from 'next/link';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useMemo } from 'react';

interface StreakOverviewProps {
  weeklyStreak: Array<{ week: string; date: string; completed: boolean; completedAt?: string; quizSlug?: string | null }>;
}

/**
 * Get week number from start of year (1-52/53)
 * Week 1 starts on January 1st
 */
function getWeekNumberFromYearStart(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  // Calculate which week this day falls into (week 1 starts on Jan 1)
  const weekNumber = Math.floor(daysSinceStart / 7) + 1;
  return Math.min(weekNumber, 52); // Cap at 52 weeks
}

export function StreakOverview({ weeklyStreak }: StreakOverviewProps) {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Create a map of completed weeks for quick lookup by date string (YYYY-MM-DD)
  const completedWeeksMap = new Map<string, { completed: boolean; completedAt?: string; quizSlug?: string | null }>();
  weeklyStreak.forEach(week => {
    const weekDate = new Date(week.date);
    weekDate.setHours(0, 0, 0, 0); // Normalize time
    if (weekDate.getFullYear() === currentYear) {
      // Use date string as key for more reliable matching
      const dateKey = weekDate.toISOString().split('T')[0];
      completedWeeksMap.set(dateKey, {
        completed: week.completed,
        completedAt: week.completedAt,
        quizSlug: week.quizSlug || null,
      });
    }
  });
  
  // Debug: Log the completed weeks map
  if (completedWeeksMap.size > 0) {
    console.log('[StreakOverview] Completed weeks map:', Array.from(completedWeeksMap.entries()));
  }

  // Generate all 52 weeks of the year
  // Each week starts on Monday, week 1 starts on Jan 1
  const allWeeks: Array<{ 
    weekNumber: number; 
    date: Date; 
    completed: boolean;
    isFuture: boolean;
    completedAt?: string;
    quizSlug?: string | null;
  }> = [];
  
  for (let weekNum = 1; weekNum <= 52; weekNum++) {
    // Calculate the date for the start of this week (Monday)
    const weekDate = new Date(startOfYear);
    const daysToAdd = (weekNum - 1) * 7;
    weekDate.setDate(startOfYear.getDate() + daysToAdd);
    weekDate.setHours(0, 0, 0, 0);
    
    // Match by date string (YYYY-MM-DD) for more reliable matching
    const dateKey = weekDate.toISOString().split('T')[0];
    const weekData = completedWeeksMap.get(dateKey);
    
    // Debug: Log matching for first few weeks
    if (weekNum <= 5) {
      console.log(`[StreakOverview] Week ${weekNum}: date=${dateKey}, found=${!!weekData}, completed=${weekData?.completed}`);
    }
    
    // Check if this week is in the future (not yet released)
    // Quizzes are typically released on Mondays, so we check if the week start date is after today
    const isFuture = weekDate > today;
    
    allWeeks.push({
      weekNumber: weekNum,
      date: weekDate,
      completed: weekData?.completed || false,
      isFuture,
      completedAt: weekData?.completedAt,
      quizSlug: weekData?.quizSlug || null,
    });
  }

  const completedCount = allWeeks.filter(w => w.completed).length;
  const totalWeeks = allWeeks.length;
  const completionRate = totalWeeks > 0 ? (completedCount / totalWeeks) * 100 : 0;

  // Calculate consecutive streak and find all weeks in the current streak
  const { currentStreak, streakWeekNumbers } = useMemo(() => {
    // Find the most recent completed week
    let mostRecentCompletedIndex = -1;
    for (let i = allWeeks.length - 1; i >= 0; i--) {
      if (allWeeks[i].completed) {
        mostRecentCompletedIndex = i;
        break;
      }
    }
    
    // If no completed weeks, return 0
    if (mostRecentCompletedIndex === -1) {
      return { currentStreak: 0, streakWeekNumbers: new Set<number>() };
    }
    
    // Count consecutive completed weeks backwards from the most recent
    // Weeks must be consecutive (week numbers sequential)
    let streak = 0;
    const streakWeeks = new Set<number>();
    let expectedWeekNumber: number | null = null;
    
    for (let i = mostRecentCompletedIndex; i >= 0; i--) {
      if (allWeeks[i].completed) {
        // Check if this week is consecutive to the previous one in the streak
        if (expectedWeekNumber === null || allWeeks[i].weekNumber === expectedWeekNumber) {
          streak++;
          streakWeeks.add(allWeeks[i].weekNumber);
          expectedWeekNumber = allWeeks[i].weekNumber - 1; // Next week should be one less
        } else {
          // Streak broken - week numbers not consecutive
          break;
        }
      } else {
        // Streak broken - gap in completed weeks
        break;
      }
    }
    
    return { currentStreak: streak, streakWeekNumbers: streakWeeks };
  }, [allWeeks]);

  const showFireAnimation = currentStreak >= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-8 overflow-visible"
      style={{ overflow: 'visible' }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center relative overflow-visible">
            {/* Animated fire icon - only animate if there's a streak */}
            {completedCount > 0 ? (
              <motion.div
                className="flex items-center justify-center"
                animate={{
                  scale: [1, 1.15, 1],
                  rotate: [0, -5, 5, -3, 3, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <motion.div
                  animate={{
                    filter: [
                      'drop-shadow(0 0 4px rgba(249, 115, 22, 0.5))',
                      'drop-shadow(0 0 8px rgba(249, 115, 22, 0.8))',
                      'drop-shadow(0 0 4px rgba(249, 115, 22, 0.5))',
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Flame className="w-5 h-5 text-orange-500" fill="currentColor" />
                </motion.div>
              </motion.div>
            ) : (
              <Flame className="w-5 h-5 text-orange-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Streak</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track your weekly quiz completion</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">of {totalWeeks} weeks</div>
          <div className="text-xs text-gray-500 dark:text-gray-500">{completionRate.toFixed(0)}% completion</div>
        </div>
      </div>

      {/* Scratchcard-style grid - Show all 52 weeks with numbers */}
      <div className="grid grid-cols-7 sm:grid-cols-13 gap-1 gap-y-3 sm:gap-1.5 sm:gap-y-4 mb-4 overflow-x-auto overflow-y-visible max-w-full relative py-6 px-3 sm:py-8 sm:px-4">
        {allWeeks.map((week, index) => {
          const dateStr = week.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const isClickable = !week.isFuture && !week.completed && !!week.quizSlug;
          
          const weekContent = (
            <motion.div
              key={week.weekNumber}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              className={`
                w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center relative overflow-visible
                ${week.completed
                  ? 'bg-green-500 text-white shadow-md border-2 border-green-600 dark:border-green-400 cursor-pointer hover:scale-110 hover:shadow-lg transition-all'
                  : week.isFuture
                  ? 'bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-700 border-2 border-gray-200 dark:border-gray-800 opacity-40 cursor-default'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 border-2 border-gray-300 dark:border-gray-700'
                }
                ${isClickable ? 'hover:scale-110 hover:border-blue-400 dark:hover:border-blue-500 transition-all group' : ''}
              `}
              title={`Week ${week.weekNumber} (${dateStr}) - ${week.completed ? 'Completed ✓' : week.isFuture ? 'Not yet released' : 'Click to play'}`}
            >
              {/* Week number - hidden when completed, visible for incomplete/future */}
              {!week.completed && (
                <span className={`text-base sm:text-lg font-bold z-10 ${week.isFuture ? 'text-gray-300 dark:text-gray-700' : 'text-gray-400 dark:text-gray-500'}`}>
                  {week.weekNumber}
                </span>
              )}
              
              {/* Green checkmark for completed weeks - similar to AnswerReveal */}
              {week.completed && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="absolute inset-0 flex items-center justify-center z-20"
                  style={{
                    background: '#10B981', // green-500
                    borderRadius: '50%',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={3} />
                </motion.div>
              )}

              {/* Fire animation overlay - on all weeks in streak when streak >= 3 */}
              {showFireAnimation && streakWeekNumbers.has(week.weekNumber) && week.completed && (
                <div 
                  className="absolute pointer-events-none z-50" 
                  style={{ 
                    bottom: '-35%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '140%',
                    height: '220%',
                    minWidth: '44px',
                    minHeight: '66px',
                  }}
                >
                  <DotLottieReact
                    src="/fire-streak.lottie"
                    loop
                    autoplay
                    className="w-full h-full"
                    style={{
                      filter: 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.5))',
                      transformOrigin: 'center bottom',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              )}
              
              {/* Hover effect for clickable weeks */}
              {isClickable && (
                <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10" />
              )}
            </motion.div>
          );

          // Wrap in Link if clickable
          if (isClickable && week.quizSlug) {
            return (
              <Link
                key={week.weekNumber}
                href={`/quizzes/${week.quizSlug}/intro`}
                className="block"
              >
                {weekContent}
              </Link>
            );
          }

          return weekContent;
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-600 dark:border-green-400 relative flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center">
            <span className="text-[8px] text-gray-400 dark:text-gray-500 font-bold">1</span>
          </div>
          <span>Available (click to play)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 opacity-40 flex items-center justify-center">
            <span className="text-[8px] text-gray-300 dark:text-gray-700 font-bold">1</span>
          </div>
          <span>Not yet released</span>
        </div>
      </div>
    </motion.div>
  );
}

