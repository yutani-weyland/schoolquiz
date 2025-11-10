import React, { useState } from 'react';

interface CategoryPerformance {
  rank: number;
  category: string;
  quizzes: number;
  avgSuccessRate: number;
  engagement: number;
  trend: number[];
}

interface CategoriesLeaderboardProps {
  data: CategoryPerformance[];
}

export function CategoriesLeaderboard({ data }: CategoriesLeaderboardProps) {
  const [sortBy, setSortBy] = useState<'quizzes' | 'avgSuccessRate' | 'engagement'>('avgSuccessRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortDirection === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const handleSort = (column: 'quizzes' | 'avgSuccessRate' | 'engagement') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (column: 'quizzes' | 'avgSuccessRate' | 'engagement') => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getTrendColor = (trend: number[]) => {
    const latest = trend[trend.length - 1];
    const previous = trend[trend.length - 2];
    if (latest > previous) return 'text-green-600 dark:text-green-400';
    if (latest < previous) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Categories</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Performance by category</p>
          </div>
          <a 
            href="/analytics/categories" 
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            View all →
          </a>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('quizzes')}
              >
                <div className="flex items-center gap-1">
                  Quizzes
                  {getSortIcon('quizzes')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('avgSuccessRate')}
              >
                <div className="flex items-center gap-1">
                  Avg Success Rate
                  {getSortIcon('avgSuccessRate')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('engagement')}
              >
                <div className="flex items-center gap-1">
                  Engagement
                  {getSortIcon('engagement')}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trend
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((item) => (
              <tr key={item.category} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      #{item.rank}
                    </span>
                    {item.rank <= 3 && (
                      <span className="ml-2 text-lg">
                        {item.rank === 1 ? '👑' : item.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {item.quizzes}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.avgSuccessRate.toFixed(1)}%
                    </span>
                    <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.avgSuccessRate}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {item.engagement.toLocaleString()} plays
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-6">
                      <svg viewBox="0 0 48 24" className="w-full h-full">
                        <polyline
                          points={item.trend.map((value, index) => 
                            `${index * 4},${24 - (value / 100) * 24}`
                          ).join(' ')}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={getTrendColor(item.trend)}
                        />
                      </svg>
                    </div>
                    <span className={`text-xs ${getTrendColor(item.trend)}`}>
                      {item.trend[item.trend.length - 1] > item.trend[item.trend.length - 2] ? '↗' : '↘'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
