'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Users, Award, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface LeaguePerformance {
  leaderboardId: string;
  leaderboardName: string;
  leaderboardType: 'ORG_WIDE' | 'GROUP' | 'AD_HOC';
  organisationName?: string;
  groupName?: string;
  userRank: number;
  totalMembers: number;
  userAverageScore: number;
  leagueAverageScore: number;
  userTotalQuizzes: number;
  leagueTotalQuizzes: number;
  performanceOverTime: Array<{
    date: string;
    userScore: number;
    leagueAverage: number;
    quizSlug: string;
  }>;
}

interface PrivateLeaguesAnalyticsProps {
  userId: string;
  colorScheme?: string;
}

export function PrivateLeaguesAnalytics({ userId, colorScheme = 'blue' }: PrivateLeaguesAnalyticsProps) {
  const [leagues, setLeagues] = useState<LeaguePerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/profile/${userId}/leagues`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error('Failed to fetch league data');
        }

        const data = await response.json();
        setLeagues(data.leagues || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load league data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchLeagueData();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading league data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-8 text-center shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (leagues.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-12 text-center shadow-sm">
        <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Private Leagues
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Join private leagues to see your performance analytics here.
        </p>
      </div>
    );
  }

  const colorClasses: Record<string, { primary: string; secondary: string }> = {
    blue: { primary: '#3B82F6', secondary: '#60A5FA' },
    purple: { primary: '#8B5CF6', secondary: '#A78BFA' },
    green: { primary: '#10B981', secondary: '#34D399' },
    orange: { primary: '#F97316', secondary: '#FB923C' },
    red: { primary: '#EF4444', secondary: '#F87171' },
    pink: { primary: '#EC4899', secondary: '#F472B6' },
  };

  const colors = colorClasses[colorScheme] || colorClasses.blue;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Leagues</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {leagues.length}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Avg Rank</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {leagues.length > 0
              ? Math.round(leagues.reduce((sum, l) => sum + l.userRank, 0) / leagues.length)
              : '-'}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Avg Score</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {leagues.length > 0
              ? Math.round(leagues.reduce((sum, l) => sum + l.userAverageScore, 0) / leagues.length)
              : '-'}
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">%</span>
          </div>
        </motion.div>
      </div>

      {/* League Performance Cards */}
      <div className="space-y-4">
        {leagues.map((league, index) => (
          <motion.div
            key={league.leaderboardId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-7 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {league.leaderboardName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {league.organisationName && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {league.organisationName}
                    </span>
                  )}
                  {league.groupName && (
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {league.groupName}
                    </span>
                  )}
                  <span className="capitalize">{league.leaderboardType.toLowerCase().replace('_', ' ')}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  #{league.userRank}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  of {league.totalMembers}
                </div>
              </div>
            </div>

            {/* Performance Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Your Average</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {league.userAverageScore.toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">League Average</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {league.leagueAverageScore.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            {league.performanceOverTime.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Performance Over Time
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={league.performanceOverTime}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      className="text-gray-500 dark:text-gray-400"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      className="text-gray-500 dark:text-gray-400"
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="userScore"
                      stroke={colors.primary}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Your Score"
                    />
                    <Line
                      type="monotone"
                      dataKey="leagueAverage"
                      stroke={colors.secondary}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                      name="League Avg"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

