'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CategoryPerformanceProps {
  strongest: Array<{ name: string; percentage: number; correct: number; total: number; quizzes: number }>;
  weakest: Array<{ name: string; percentage: number; correct: number; total: number; quizzes: number }>;
}

export function CategoryPerformance({ strongest, weakest }: CategoryPerformanceProps) {
  const COLORS = {
    strong: '#10B981',
    weak: '#EF4444',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
      {/* Strongest Categories */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Strongest Categories</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your best performing topics</p>
          </div>
        </div>
        {strongest.length > 0 ? (
          <div className="w-full" style={{ minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height={250}>
            <BarChart data={strongest.slice().reverse()} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} className="text-gray-500 dark:text-gray-400" />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={100}
                className="text-gray-500 dark:text-gray-400"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
              />
              <Bar dataKey="percentage" radius={[0, 8, 8, 0]}>
                {strongest.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.strong} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Award className="w-12 h-12 mb-2" />
            <p className="text-sm">Play more quizzes to see your strongest categories</p>
          </div>
        )}
      </motion.div>

      {/* Weakest Categories */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weakest Categories</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Areas to improve</p>
          </div>
        </div>
        {weakest.length > 0 ? (
          <div className="w-full" style={{ minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weakest} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} className="text-gray-500 dark:text-gray-400" />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={100}
                className="text-gray-500 dark:text-gray-400"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
              />
              <Bar dataKey="percentage" radius={[0, 8, 8, 0]}>
                {weakest.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.weak} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <AlertCircle className="w-12 h-12 mb-2" />
            <p className="text-sm">Play more quizzes to see areas for improvement</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

