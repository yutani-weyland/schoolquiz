'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Users, Target, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react'
import { ChartSkeleton, StatCardSkeleton } from '@/components/admin/ui/skeletons'

// Lazy load recharts - code-split to reduce initial bundle
const LineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { ssr: false, loading: () => <ChartSkeleton height={400} /> }
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

interface FunnelData {
  signups: { total: number; thisMonth: number; previousMonth: number; change: number }
  firstQuiz: { total: number; thisMonth: number; previousMonth: number; change: number; conversionRate: number }
  orgCreation: { total: number; thisMonth: number; previousMonth: number; change: number; conversionRate: number }
  paid: { total: number; thisMonth: number; previousMonth: number; change: number; conversionRate: number }
  funnelSteps: Array<{ step: string; count: number; percentage: number; color: string }>
  conversionByWeek: Array<{ week: string; signups: number; firstQuiz: number; orgCreation: number; paid: number }>
  dropoffPoints: Array<{ stage: string; dropoff: number; percentage: number }>
}

export default function FunnelAnalyticsPage() {
  const [data, setData] = useState<FunnelData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/analytics/funnel')
      const result = await response.json()
      console.log('Funnel analytics API response:', result)
      
      if (response.ok) {
        setData(result)
      } else {
        console.error('API error:', result)
      }
    } catch (error) {
      console.error('Failed to fetch funnel analytics:', error)
    } finally {
      setIsLoading(false)
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

        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={400} />
          <ChartSkeleton height={400} />
        </div>

        {/* Table skeleton */}
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
          Funnel Analytics
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          User conversion from signup to paid subscription
        </p>
      </div>

      {/* Funnel Steps */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Conversion Funnel
        </h2>
        <div className="space-y-4">
          {data.funnelSteps.map((step, index) => (
            <div key={step.step} className="relative">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: step.color }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {step.step}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {step.count.toLocaleString()} users ({step.percentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {step.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${step.percentage}%`,
                        backgroundColor: step.color,
                      }}
                    />
                  </div>
                </div>
                {index < data.funnelSteps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-gray-400 mx-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Signups</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {data.signups.total.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400">
                  +{data.signups.change}%
                </span>
              </div>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">First Quiz</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {data.firstQuiz.total.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {data.firstQuiz.conversionRate.toFixed(1)}% conversion
              </p>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Org Creation</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {data.orgCreation.total.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {data.orgCreation.conversionRate.toFixed(1)}% conversion
              </p>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Paid</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {data.paid.total.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {data.paid.conversionRate.toFixed(1)}% conversion
              </p>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Over Time */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Conversion Trends (Last 8 Weeks)
        </h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.conversionByWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis 
                dataKey="week"
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
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
                dataKey="signups" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                name="Signups"
              />
              <Line 
                type="monotone" 
                dataKey="firstQuiz" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
                name="First Quiz"
              />
              <Line 
                type="monotone" 
                dataKey="orgCreation" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 4 }}
                name="Org Creation"
              />
              <Line 
                type="monotone" 
                dataKey="paid" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={{ fill: '#F59E0B', r: 4 }}
                name="Paid"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dropoff Points */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Dropoff Analysis
        </h2>
        <div className="space-y-4">
          {data.dropoffPoints.map((dropoff, index) => (
            <div
              key={dropoff.stage}
              className="p-4 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/30 dark:to-gray-800/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {dropoff.stage}
                </p>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {dropoff.dropoff.toLocaleString()} users ({dropoff.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-red-500 transition-all"
                  style={{ width: `${dropoff.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

