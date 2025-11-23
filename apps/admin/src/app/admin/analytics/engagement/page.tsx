'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Users, TrendingUp, TrendingDown, Activity, Building2 } from 'lucide-react'
import { ChartSkeleton, StatCardSkeleton } from '@/components/admin/ui/skeletons'

// Lazy load recharts - code-split to reduce initial bundle
const LineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { ssr: false, loading: () => <ChartSkeleton height={400} /> }
)
const BarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  { ssr: false, loading: () => <ChartSkeleton height={300} /> }
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

interface EngagementData {
  dau: { current: number; previous: number; change: number; trend: 'up' | 'down' }
  mau: { current: number; previous: number; change: number; trend: 'up' | 'down' }
  quizAttemptsPerDay: Array<{ date: string; attempts: number }>
  topActiveOrgs: Array<{ id: string; name: string; attempts: number; users: number; avgScore: number }>
  activeUsersByDay: Array<{ date: string; users: number }>
}

export default function EngagementAnalyticsPage() {
  const [data, setData] = useState<EngagementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/analytics/engagement')
      const result = await response.json()
      console.log('Engagement analytics API response:', result)
      
      if (response.ok) {
        setData(result)
      } else {
        console.error('API error:', result)
      }
    } catch (error) {
      console.error('Failed to fetch engagement analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
  }

  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B']

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-9 w-64 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
          <div className="h-4 w-96 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
        </div>

        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
        </div>

        {/* Table skeleton */}
        <ChartSkeleton height={400} />
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-12">Failed to load analytics</div>
  }

  const chartData = data.quizAttemptsPerDay.map(item => ({
    date: formatDate(item.date),
    attempts: item.attempts,
    users: data.activeUsersByDay.find(u => u.date === item.date)?.users || 0,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Engagement Analytics
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Daily and monthly active users, quiz attempts, and top performing organisations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Daily Active Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {data.dau.current.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {data.dau.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${data.dau.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {data.dau.change > 0 ? '+' : ''}{data.dau.change}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">vs previous period</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Active Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {data.mau.current.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {data.mau.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${data.mau.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {data.mau.change > 0 ? '+' : ''}{data.mau.change}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">vs previous period</span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
              <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Attempts Chart */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quiz Attempts & Active Users (Last 30 Days)
        </h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                className="text-xs"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
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
                yAxisId="left"
                type="monotone" 
                dataKey="attempts" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
                name="Quiz Attempts"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="users" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={false}
                name="Active Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Active Organisations */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Active Organisations
        </h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topActiveOrgs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
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
              <Bar dataKey="attempts" fill="#3B82F6" radius={[8, 8, 0, 0]}>
                {data.topActiveOrgs.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {data.topActiveOrgs.map((org, index) => (
            <div
              key={org.id}
              className="flex items-center justify-between p-3 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/30 dark:to-gray-800/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{org.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {org.users} users • Avg score: {org.avgScore}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {org.attempts.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">attempts</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

