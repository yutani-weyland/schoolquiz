'use client'

import { Building2, Users, BookOpen, TrendingUp, Activity, Clock, CheckCircle2, AlertCircle, BarChart3, Zap, Plus, Crown, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type TimePeriod = 'week' | 'month' | 'year'

interface UserStats {
  total: number
  premium: number
  basic: number
  active: number
}

interface PlatformStats {
  users: UserStats
  organisations: {
    total: number
    active: number
  }
  quizAttempts: {
    last30Days: number
  }
}

/**
 * Time Period Toggle Component
 */
function TimePeriodToggle({ 
  value, 
  onChange 
}: { 
  value: TimePeriod
  onChange: (period: TimePeriod) => void 
}) {
  const periods: { label: string; value: TimePeriod }[] = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' },
  ]

  return (
    <div className="inline-flex items-center gap-0.5 bg-[hsl(var(--muted))] rounded-md p-0.5">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 ${
            value === period.value
              ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm font-semibold'
              : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/50'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Admin Overview Page
 * Displays key statistics and overview of the platform
 */
export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState<string>('')
  const [timePeriods, setTimePeriods] = useState<Record<string, TimePeriod>>({
    'active-orgs': 'month',
    'active-users': 'month',
    'quiz-attempts': 'month',
    'completion-rate': 'month',
  })

  useEffect(() => {
    fetchStats()
  }, [])

  // Update time only on client side to prevent hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // TODO: Fetch real statistics from database
  // For Phase 0, we'll use placeholder data

  // Mock data for different time periods
  const getTimePeriodData = (metric: string, period: TimePeriod) => {
    const data: Record<string, Record<TimePeriod, { value: string; trend: string; description: string }>> = {
      'Active Orgs': {
        week: { value: '2', trend: '+5%', description: 'Organisations active in the last 7 days' },
        month: { value: stats?.organisations.active.toString() || '4', trend: '+12%', description: 'Organisations active in the last 30 days' },
        year: { value: '18', trend: '+45%', description: 'Organisations active in the last 365 days' },
      },
      'Active Users': {
        week: { value: '3', trend: '+2%', description: 'Users active in the last 7 days' },
        month: { value: stats?.users.active.toString() || '6', trend: '+8%', description: 'Users active in the last 30 days' },
        year: { value: '42', trend: '+28%', description: 'Users active in the last 365 days' },
      },
      'Quiz Attempts': {
        week: { value: '48', trend: '+15%', description: 'Total quiz attempts in the last 7 days' },
        month: { value: stats?.quizAttempts.last30Days.toString() || '205', trend: '+24%', description: 'Total quiz attempts in the last 30 days' },
        year: { value: '2,840', trend: '+67%', description: 'Total quiz attempts in the last 365 days' },
      },
      'Avg Completion Rate': {
        week: { value: '89%', trend: '+5%', description: 'Average quiz completion rate (7d)' },
        month: { value: '87%', trend: '+3%', description: 'Average quiz completion rate (30d)' },
        year: { value: '85%', trend: '+8%', description: 'Average quiz completion rate (365d)' },
      },
    }
    return data[metric]?.[period] || { value: '0', trend: '0%', description: '' }
  }

  const statCards = [
    {
      id: 'active-orgs',
      title: 'Active Orgs',
      icon: Building2,
      hasTimeToggle: true,
      getData: (period: TimePeriod) => getTimePeriodData('Active Orgs', period),
    },
    {
      id: 'active-users',
      title: 'Active Users',
      icon: Users,
      hasTimeToggle: true,
      getData: (period: TimePeriod) => getTimePeriodData('Active Users', period),
    },
    {
      id: 'quiz-attempts',
      title: 'Quiz Attempts',
      icon: BookOpen,
      hasTimeToggle: true,
      getData: (period: TimePeriod) => getTimePeriodData('Quiz Attempts', period),
    },
    {
      id: 'completion-rate',
      title: 'Avg Completion Rate',
      icon: CheckCircle2,
      hasTimeToggle: true,
      getData: (period: TimePeriod) => getTimePeriodData('Avg Completion Rate', period),
    },
    {
      id: 'active-quizzes',
      title: 'Active Quizzes',
      icon: Zap,
      hasTimeToggle: false,
      value: '12',
      description: 'Published quizzes available',
      trend: '2 new',
      trendDirection: 'neutral' as const,
    },
    {
      id: 'response-time',
      title: 'Response Time',
      icon: Activity,
      hasTimeToggle: false,
      value: '1.2s',
      description: 'Average API response time',
      trend: '-0.3s',
      trendDirection: 'down' as const,
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'quiz_created',
      message: 'New quiz "World History Week 3" created',
      time: '2 hours ago',
      user: 'Sarah Chen',
    },
    {
      id: 2,
      type: 'org_joined',
      message: 'New organisation "Melbourne High School" joined',
      time: '5 hours ago',
      user: 'System',
    },
    {
      id: 3,
      type: 'question_added',
      message: '50 new questions added to History category',
      time: '1 day ago',
      user: 'John Smith',
    },
    {
      id: 4,
      type: 'quiz_completed',
      message: 'Quiz "Science Fundamentals" completed by 45 students',
      time: '2 days ago',
      user: 'System',
    },
  ]

  const quickActions = [
    { label: 'Create Quiz', href: '/admin/quizzes/builder', icon: BookOpen },
    { label: 'Add Question', href: '/admin/questions/create', icon: Plus },
    { label: 'View Organisations', href: '/admin/organisations', icon: Building2 },
    { label: 'View Analytics', href: '/admin/analytics', icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            Admin Overview
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Platform statistics and key metrics
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <Clock className="w-4 h-4" />
          <span>Last updated: {currentTime || '--:--:--'}</span>
        </div>
      </div>

      {/* User Split Section - Free vs Premium */}
      <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[hsl(var(--foreground))] tracking-tight">
            User Distribution
          </h2>
          {stats && (
            <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
              <span>Total: <span className="font-semibold text-[hsl(var(--foreground))]">{stats.users.total}</span></span>
              <span>Active (30d): <span className="font-semibold text-[hsl(var(--foreground))]">{stats.users.active}</span></span>
            </div>
          )}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[hsl(var(--primary))]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Free Users */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {stats?.users.basic || 0}
                  </p>
                  {stats?.users.total && (
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      ({Math.round((stats.users.basic / stats.users.total) * 100)}%)
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">Free Users</p>
              </div>
            </div>

            {/* Premium Users */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {stats?.users.premium || 0}
                  </p>
                  {stats?.users.total && (
                    <span className="text-xs text-purple-700 dark:text-purple-300">
                      ({Math.round((stats.users.premium / stats.users.total) * 100)}%)
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">Premium Users</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((stat) => {
          const Icon = stat.icon
          const cardTimePeriod = stat.hasTimeToggle ? (timePeriods[stat.id] || 'month') : 'month'
          const data = stat.hasTimeToggle && stat.getData ? stat.getData(cardTimePeriod) : {
            value: stat.value!,
            trend: stat.trend!,
            description: stat.description!,
          }
          const trendDirection = stat.hasTimeToggle 
            ? (data.trend.startsWith('+') ? 'up' : data.trend.startsWith('-') ? 'down' : 'neutral')
            : stat.trendDirection
          const trendColor = 
            trendDirection === 'up' ? 'text-green-500' :
            trendDirection === 'down' ? 'text-red-500' :
            'text-[hsl(var(--muted-foreground))]'
          
          return (
            <div
              key={stat.id}
              className="group relative bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      {stat.title}
                    </p>
                    {stat.hasTimeToggle && (
                      <TimePeriodToggle 
                        value={cardTimePeriod} 
                        onChange={(period) => setTimePeriods(prev => ({ ...prev, [stat.id]: period }))} 
                      />
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <p className="text-4xl font-extrabold text-[hsl(var(--foreground))] tracking-tight">
                      {data.value}
                    </p>
                    {data.trend && (
                      <span className={`text-sm font-medium ${trendColor} flex items-center gap-1`}>
                        <TrendingUp className={`w-3 h-3 ${trendDirection === 'down' ? 'rotate-180' : ''}`} />
                        {data.trend}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-normal text-[hsl(var(--muted-foreground))] leading-relaxed opacity-90">
                    {data.description}
                  </p>
                </div>
                <div className="p-3 bg-[hsl(var(--muted))] rounded-xl flex-shrink-0">
                  <Icon className="w-6 h-6 text-[hsl(var(--primary))]" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4 tracking-tight">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] transition-colors group"
                  >
                    <Icon className="w-5 h-5 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors" />
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                      {action.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))] tracking-tight">
                Recent Activity
              </h2>
              <Link
                href="/admin/system/audit-log"
                className="text-sm text-[hsl(var(--primary))] hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-4 border-b border-[hsl(var(--border))] last:border-0 last:pb-0"
                >
                  <div className="p-2 bg-[hsl(var(--muted))] rounded-lg">
                    <Activity className="w-4 h-4 text-[hsl(var(--primary))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      {activity.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {activity.user}
                      </p>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">•</span>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Health & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Health */}
        <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
          <h2 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4 tracking-tight">
            Platform Health
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[hsl(var(--muted))] rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Database</p>
                  <p className="text-xs font-normal text-[hsl(var(--muted-foreground))]">All systems operational</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium text-green-500 bg-[hsl(var(--muted))] rounded-lg">
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[hsl(var(--muted))] rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">API Services</p>
                  <p className="text-xs font-normal text-[hsl(var(--muted-foreground))]">Response time: 1.2s avg</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium text-green-500 bg-[hsl(var(--muted))] rounded-lg">
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[hsl(var(--muted))] rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Storage</p>
                  <p className="text-xs font-normal text-[hsl(var(--muted-foreground))]">75% capacity used</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium text-yellow-500 bg-[hsl(var(--muted))] rounded-lg">
                Warning
              </span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
          <h2 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4 tracking-tight">
            System Status
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Uptime (30d)</span>
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">99.9%</span>
              </div>
              <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '99.9%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Active Sessions</span>
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">142</span>
              </div>
              <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '47%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">API Requests (24h)</span>
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">12.4k</span>
              </div>
              <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '62%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
