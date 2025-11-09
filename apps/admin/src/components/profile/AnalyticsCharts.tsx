'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface PerformanceChartProps {
  data: Array<{ date: string; score: number; quizSlug: string }>;
  colorScheme?: string;
}

const COLOR_SCHEMES: Record<string, { line: string; area: string }> = {
  blue: { line: '#3B82F6', area: 'rgba(59, 130, 246, 0.1)' },
  purple: { line: '#8B5CF6', area: 'rgba(139, 92, 246, 0.1)' },
  green: { line: '#10B981', area: 'rgba(16, 185, 129, 0.1)' },
  orange: { line: '#F59E0B', area: 'rgba(245, 158, 11, 0.1)' },
  red: { line: '#EF4444', area: 'rgba(239, 68, 68, 0.1)' },
  pink: { line: '#EC4899', area: 'rgba(236, 72, 153, 0.1)' },
};

export function PerformanceChart({ data, colorScheme = 'blue' }: PerformanceChartProps) {
  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.blue;
  
  // Format data for chart - keep score as /25, not percentage
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    score: item.score, // Keep as raw score out of 25
    fullDate: item.date,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {payload[0].payload.fullDate}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Score: <span className="font-semibold">{payload[0].value}/25</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey="date" 
            stroke="#6B7280"
            className="text-xs"
            tick={{ fill: '#6B7280' }}
          />
          <YAxis 
            domain={[0, 25]}
            stroke="#6B7280"
            className="text-xs"
            tick={{ fill: '#6B7280' }}
            label={{ value: '/25', angle: -90, position: 'insideLeft', fill: '#6B7280' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke={colors.line} 
            strokeWidth={2.5}
            dot={{ fill: colors.line, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface StrengthAreasChartProps {
  data: Array<{ category: string; score: number; total: number }>;
  colorScheme?: string;
}

export function StrengthAreasChart({ data, colorScheme = 'blue' }: StrengthAreasChartProps) {
  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.blue;
  
  // Calculate percentage and sort by score
  const chartData = data
    .map(item => ({
      category: item.category,
      percentage: Math.round((item.score / item.total) * 100),
      score: item.score,
      total: item.total,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5); // Top 5 categories

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {data.category}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.score}/{data.total} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
          <XAxis 
            type="number" 
            domain={[0, 100]}
            stroke="#6B7280"
            className="text-xs"
            tick={{ fill: '#6B7280' }}
          />
          <YAxis 
            type="category" 
            dataKey="category" 
            stroke="#6B7280"
            className="text-xs"
            tick={{ fill: '#6B7280' }}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="percentage" radius={[0, 8, 8, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors.line} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

