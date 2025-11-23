'use client'

/**
 * Client components for Admin Overview Page
 * Handles interactive features like time period toggles and clock
 */

import React, { useState, useEffect } from 'react'
import { Building2, Users, BookOpen, TrendingUp, CheckCircle2, Zap, Activity } from 'lucide-react'
import { StatCardSkeleton } from '@/components/admin/ui/skeletons'

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
          className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 ${value === period.value
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
 * Clock Component - Updates every second
 */
export function Clock() {
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return <span>{currentTime || '--:--:--'}</span>
}

/**
 * Stat Cards Component - Client component for interactivity
 */
export function StatCards({ initialStats }: { initialStats: PlatformStats | null }) {
  const [timePeriods, setTimePeriods] = useState<Record<string, TimePeriod>>({
    'active-orgs': 'month',
    'active-users': 'month',
    'quiz-attempts': 'month',
    'completion-rate': 'month',
  })

  // Mock data for different time periods
  const getTimePeriodData = (metric: string, period: TimePeriod) => {
    const data: Record<string, Record<TimePeriod, { value: string; trend: string; description: string }>> = {
      'Active Orgs': {
        week: { value: '2', trend: '+5%', description: 'Organisations active in the last 7 days' },
        month: { value: initialStats?.organisations.active.toString() || '4', trend: '+12%', description: 'Organisations active in the last 30 days' },
        year: { value: '18', trend: '+45%', description: 'Organisations active in the last 365 days' },
      },
      'Active Users': {
        week: { value: '3', trend: '+2%', description: 'Users active in the last 7 days' },
        month: { value: initialStats?.users.active.toString() || '6', trend: '+8%', description: 'Users active in the last 30 days' },
        year: { value: '42', trend: '+28%', description: 'Users active in the last 365 days' },
      },
      'Quiz Attempts': {
        week: { value: '48', trend: '+15%', description: 'Total quiz attempts in the last 7 days' },
        month: { value: initialStats?.quizAttempts.last30Days.toString() || '205', trend: '+24%', description: 'Total quiz attempts in the last 30 days' },
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

  return (
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
            className="group relative bg-[hsl(var(--card))] rounded-2xl p-4 sm:p-6 border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2 flex-wrap">
                  <p className="text-[10px] sm:text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider truncate">
                    {stat.title}
                  </p>
                  {stat.hasTimeToggle && (
                    <div className="hidden sm:block">
                      <TimePeriodToggle
                        value={cardTimePeriod}
                        onChange={(period) => setTimePeriods(prev => ({ ...prev, [stat.id]: period }))}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[hsl(var(--foreground))] tracking-tight">
                    {data.value}
                  </p>
                  {data.trend && (
                    <span className={`text-xs sm:text-sm font-medium ${trendColor} flex items-center gap-0.5 sm:gap-1`}>
                      <TrendingUp className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${trendDirection === 'down' ? 'rotate-180' : ''}`} />
                      <span className="hidden sm:inline">{data.trend}</span>
                      <span className="sm:hidden">{data.trend.replace(/[^+\-%]/g, '')}</span>
                    </span>
                  )}
                </div>
                <p className="hidden sm:block text-xs font-normal text-[hsl(var(--muted-foreground))] leading-relaxed opacity-90">
                  {data.description}
                </p>
                {stat.hasTimeToggle && (
                  <div className="sm:hidden mt-1.5">
                    <TimePeriodToggle
                      value={cardTimePeriod}
                      onChange={(period) => setTimePeriods(prev => ({ ...prev, [stat.id]: period }))}
                    />
                  </div>
                )}
              </div>
              <div className="p-2 sm:p-3 bg-[hsl(var(--muted))] rounded-lg sm:rounded-xl flex-shrink-0">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[hsl(var(--primary))]" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Export as namespace for cleaner imports
export const AdminOverviewClient = {
  Clock,
  StatCards,
}


