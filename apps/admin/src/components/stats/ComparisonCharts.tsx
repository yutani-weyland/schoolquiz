'use client';

import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';
import { Users, Trophy, TrendingUp } from 'lucide-react';
// OPTIMIZATION: Lazy-load recharts to reduce initial bundle size
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from './recharts-lazy';

interface ComparisonChartsProps {
  publicStats: {
    averageScore: number;
    totalUsers: number;
  };
  leagueComparisons: Array<{
    leagueId: string;
    leagueName: string;
    userAverage: number;
    leagueAverage: number;
    userRank: number;
    totalMembers: number;
  }>;
  userAverage: number;
}

export const ComparisonCharts = memo(function ComparisonCharts({ publicStats, leagueComparisons, userAverage }: ComparisonChartsProps) {
  // Public comparison data - memoize to avoid recalculation
  const publicComparisonData = useMemo(() => [
    { name: 'You', score: userAverage },
    { name: 'Public Average', score: publicStats.averageScore },
  ], [userAverage, publicStats.averageScore]);

  // League comparison data for radar chart
  const leagueRadarData = leagueComparisons.map(league => ({
    league: league.leagueName,
    you: league.userAverage,
    leagueAvg: league.leagueAverage,
  }));

  return (
    <div className="space-y-6">
      {/* Public Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Public Comparison</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">How you compare to all users</p>
          </div>
        </div>
        <div className="w-full" style={{ minHeight: '200px' }}>
          <ResponsiveContainer width="100%" height={250}>
          <BarChart data={publicComparisonData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-gray-500 dark:text-gray-400" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} className="text-gray-500 dark:text-gray-400" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Average Score']}
            />
            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
              {publicComparisonData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? '#3B82F6' : '#94A3B8'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </motion.div>

      {/* League Comparisons */}
      {leagueComparisons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">League Comparisons</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your performance in private leagues</p>
            </div>
          </div>

          <div className="space-y-6">
            {leagueComparisons.map((league, index) => (
              <div key={league.leagueId} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{league.leagueName}</h4>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Rank #{league.userRank} of {league.totalMembers}
                    </span>
                  </div>
                </div>
                <div className="w-full" style={{ minHeight: '150px' }}>
                  <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={[
                    { name: 'You', score: league.userAverage },
                    { name: 'League Avg', score: league.leagueAverage },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-gray-500 dark:text-gray-400" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="text-gray-500 dark:text-gray-400" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Average Score']}
                    />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                      <Cell fill="#8B5CF6" />
                      <Cell fill="#A78BFA" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
});

