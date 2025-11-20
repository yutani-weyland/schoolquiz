'use client'

import Link from 'next/link'
import { BarChart3, Users, BookOpen, TrendingUp, ArrowRight } from 'lucide-react'
import { Card, PageHeader, Badge } from '@/components/admin/ui'

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
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/30',
        icon: 'text-green-600 dark:text-green-400',
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/30',
        icon: 'text-purple-600 dark:text-purple-400',
      },
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Comprehensive analytics and insights across engagement, learning, and conversion metrics"
      />

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {analyticsPages.map((page) => {
          const Icon = page.icon
          const colors = getColorClasses(page.color)
          
          return (
            <Link key={page.id} href={page.href}>
              <Card className="group hover:border-[hsl(var(--primary))] transition-all duration-200 cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${colors.bg} rounded-xl`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <ArrowRight className="w-5 h-5 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors" />
                </div>
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                  {page.title}
                </h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                  {page.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {page.metrics.map((metric) => (
                    <Badge key={metric} variant="default">
                      {metric}
                    </Badge>
                  ))}
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <Card>
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analyticsPages.map((page) => {
            const Icon = page.icon
            return (
              <Link
                key={page.id}
                href={page.href}
                className="flex items-center gap-3 p-4 bg-[hsl(var(--muted))] rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/80 transition-all duration-200"
              >
                <Icon className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                  {page.title}
                </span>
                <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] ml-auto" />
              </Link>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

