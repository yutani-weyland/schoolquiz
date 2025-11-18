'use client'

import Link from 'next/link'
import { BarChart3, Users, BookOpen, TrendingUp, ArrowRight } from 'lucide-react'

export default function AnalyticsPage() {
  const analyticsPages = [
    {
      id: 'engagement',
      title: 'Engagement Analytics',
      description: 'Daily and monthly active users, quiz attempts, and top performing organisations',
      href: '/admin/analytics/engagement',
      icon: Users,
      color: 'blue',
      metrics: ['DAU/MAU', 'Quiz Attempts', 'Top Orgs'],
    },
    {
      id: 'learning',
      title: 'Learning Analytics',
      description: 'Outcome coverage, most missed outcomes, and learning progress over time',
      href: '/admin/analytics/learning',
      icon: BookOpen,
      color: 'green',
      metrics: ['Outcome Coverage', 'Missed Outcomes', 'Progress Tracking'],
    },
    {
      id: 'funnel',
      title: 'Funnel Analytics',
      description: 'User conversion from signup to paid subscription',
      href: '/admin/analytics/funnel',
      icon: TrendingUp,
      color: 'purple',
      metrics: ['Signup → Quiz', 'Org Creation', 'Paid Conversion'],
    },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        icon: 'text-blue-600 dark:text-blue-400',
        hover: 'hover:from-blue-50 hover:to-blue-100/50 dark:hover:from-blue-900/30 dark:hover:to-blue-900/20',
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/30',
        icon: 'text-green-600 dark:text-green-400',
        hover: 'hover:from-green-50 hover:to-green-100/50 dark:hover:from-green-900/30 dark:hover:to-green-900/20',
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/30',
        icon: 'text-purple-600 dark:text-purple-400',
        hover: 'hover:from-purple-50 hover:to-purple-100/50 dark:hover:from-purple-900/30 dark:hover:to-purple-900/20',
      },
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-500" />
          Analytics
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Comprehensive analytics and insights across engagement, learning, and conversion metrics
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {analyticsPages.map((page) => {
          const Icon = page.icon
          const colors = getColorClasses(page.color)
          
          return (
            <Link
              key={page.id}
              href={page.href}
              className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 ${colors.bg} rounded-xl`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {page.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {page.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {page.metrics.map((metric) => (
                  <span
                    key={metric}
                    className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analyticsPages.map((page) => {
            const Icon = page.icon
            return (
              <Link
                key={page.id}
                href={page.href}
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/30 dark:to-gray-800/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200"
              >
                <Icon className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {page.title}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

