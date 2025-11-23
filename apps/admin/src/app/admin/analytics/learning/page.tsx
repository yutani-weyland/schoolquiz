'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { BookOpen, AlertCircle, TrendingUp, Target } from 'lucide-react'
import { ChartSkeleton } from '@/components/admin/ui/skeletons'

// Lazy load recharts - code-split to reduce initial bundle
const LineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { ssr: false, loading: () => <ChartSkeleton height={300} /> }
)
const BarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  { ssr: false, loading: () => <ChartSkeleton height={400} /> }
)
const Line = dynamic(
  () => import('recharts').then(mod => mod.Line),
  { ssr: false }
)
const Bar = dynamic(
  () => import('recharts').then(mod => mod.Bar),
  { ssr: false }
)
const XAxis = dynamic(
  () => import('recharts').then(mod => mod.XAxis),
  { ssr: false }
)
const YAxis = dynamic(
  () => import('recharts').then(mod => mod.YAxis),
  { ssr: false }
)
const CartesianGrid = dynamic(
  () => import('recharts').then(mod => mod.CartesianGrid),
  { ssr: false }
)
const Tooltip = dynamic(
  () => import('recharts').then(mod => mod.Tooltip),
  { ssr: false }
)
const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
)
const Cell = dynamic(
  () => import('recharts').then(mod => mod.Cell),
  { ssr: false }
)

interface LearningData {
  outcomeCoverage: Array<{ outcome: string; coverage: number; questions: number; correct: number }>
  mostMissedOutcomes: Array<{ outcome: string; missed: number; total: number; percentage: number; difficulty: string }>
  performanceByDifficulty: Array<{ difficulty: string; questions: number; correct: number; percentage: number }>
  learningProgress: Array<{ week: string; avgScore: number; completions: number }>
}

export default function LearningAnalyticsPage() {
  const [data, setData] = useState<LearningData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/analytics/learning')
      const result = await response.json()
      console.log('Learning analytics API response:', result)
      
      if (response.ok) {
        setData(result)
      } else {
        console.error('API error:', result)
      }
    } catch (error) {
      console.error('Failed to fetch learning analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#84CC16']

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'High': return '#EF4444'
      case 'Medium': return '#F59E0B'
      case 'Low': return '#10B981'
      default: return '#6B7280'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-9 w-64 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
          <div className="h-4 w-96 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={400} />
          <ChartSkeleton height={400} />
        </div>

        {/* More charts */}
        <ChartSkeleton height={400} />
        <ChartSkeleton height={300} />
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-12">Failed to load analytics</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Learning Analytics
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Outcome coverage, most missed outcomes, and learning progress over time
        </p>
      </div>

      {/* Outcome Coverage Chart */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Outcome Coverage by Subject
        </h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.outcomeCoverage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis 
                type="number"
                domain={[0, 100]}
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
                label={{ value: 'Coverage %', position: 'insideBottom', offset: -5, fill: '#6b7280' }}
              />
              <YAxis 
                type="category"
                dataKey="outcome"
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}%`,
                  'Coverage'
                ]}
              />
              <Bar dataKey="coverage" fill="#3B82F6" radius={[0, 8, 8, 0]}>
                {data.outcomeCoverage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.outcomeCoverage.map((outcome, index) => (
            <div
              key={outcome.outcome}
              className="p-3 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/30 dark:to-gray-800/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {outcome.outcome}
                </p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {outcome.coverage.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {outcome.correct}/{outcome.questions} correct
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Most Missed Outcomes */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          Most Missed Outcomes
        </h2>
        <div className="space-y-3">
          {data.mostMissedOutcomes.map((outcome, index) => (
            <div
              key={outcome.outcome}
              className="p-4 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/30 dark:to-gray-800/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {outcome.outcome}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {outcome.missed.toLocaleString()} missed out of {outcome.total.toLocaleString()} attempts
                  </p>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: getDifficultyColor(outcome.difficulty) + '20',
                    color: getDifficultyColor(outcome.difficulty),
                  }}
                >
                  {outcome.difficulty}
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Miss rate</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    {outcome.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${outcome.percentage}%`,
                      backgroundColor: getDifficultyColor(outcome.difficulty),
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance by Difficulty & Learning Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Difficulty */}
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance by Difficulty
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.performanceByDifficulty}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis 
                  dataKey="difficulty"
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280' }}
                  label={{ value: 'Correct %', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Correct Rate']}
                />
                <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                  {data.performanceByDifficulty.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getDifficultyColor(entry.difficulty)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Learning Progress */}
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Learning Progress Over Time
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.learningProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis 
                  dataKey="week"
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280' }}
                  label={{ value: 'Avg Score %', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgScore" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', r: 4 }}
                  name="Average Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

