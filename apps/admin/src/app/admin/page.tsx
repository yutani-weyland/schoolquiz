/**
 * Admin Overview Page - Server Component with Streaming
 * Fetches stats on the server and streams content progressively
 */

import { Suspense } from 'react'
import { Building2, Users, BookOpen, TrendingUp, Activity, Clock, CheckCircle2, AlertCircle, BarChart3, Zap, Plus, Crown, User } from 'lucide-react'
import Link from 'next/link'
import { PageHeader, StatusStrip, Badge } from '@/components/admin/ui'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatCardSkeleton } from '@/components/admin/ui/skeletons'
import { fetchAdminStats } from './admin-stats-server'
import { ClockDisplay } from './ClockDisplay'
import { StatCardsWrapper } from './StatCardsWrapper'

// Force dynamic for admin pages (user-specific data)
export const dynamic = 'force-dynamic'

/**
 * Server Component - Admin Overview Page
 * Fetches stats on the server and streams content
 */
export default async function AdminOverviewPage() {
  // Fetch stats on the server (this will be cached)
  const statsPromise = fetchAdminStats()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Platform statistics and key metrics"
        action={
          <Suspense fallback={<span className="text-sm text-[hsl(var(--muted-foreground))]">--:--:--</span>}>
            <ClockDisplay />
          </Suspense>
        }
      />

      {/* Status Strips - Example usage */}
      <StatusStrips />

      {/* User Distribution - Stream this section */}
      <Suspense fallback={<UserDistributionSkeleton />}>
        <UserDistributionWrapper statsPromise={statsPromise} />
      </Suspense>

      {/* Stat Cards - Stream this section */}
      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCardsAsyncWrapper statsPromise={statsPromise} />
      </Suspense>

      {/* Quick Actions & Recent Activity - Static content, no streaming needed */}
      <QuickActionsAndActivity />

      {/* Platform Health & System Status - Static content */}
      <PlatformHealth />
    </div>
  )
}

/**
 * Client component for clock display
 * Must be in a separate file with 'use client' directive
 */

/**
 * Status Strips Component
 */
function StatusStrips() {
  const hasStorageWarning = false
  const hasSystemIssues = false

  return (
    <>
      {hasStorageWarning && (
        <StatusStrip
          variant="warning"
          message="Storage capacity at 75%"
          details="Consider cleaning up old data or upgrading storage plan."
          action={{
            label: 'View Storage',
            onClick: () => window.location.href = '/admin/system',
          }}
        />
      )}
      {hasSystemIssues && (
        <StatusStrip
          variant="error"
          message="System health check failed"
          details="Some services are experiencing issues. Check system status for details."
          action={{
            label: 'View Status',
            onClick: () => window.location.href = '/admin/system',
          }}
        />
      )}
    </>
  )
}

/**
 * User Distribution Wrapper - Handles async component properly
 */
async function UserDistributionWrapper({ statsPromise }: { statsPromise: Promise<any> }) {
  const stats = await statsPromise
  return <UserDistributionContent stats={stats} />
}

/**
 * User Distribution Component - Server Component with streaming
 */
function UserDistributionContent({ stats }: { stats: any }) {
  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">
          User Distribution
        </h2>
        {stats && (
          <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
            <span>Total: <span className="font-semibold text-[hsl(var(--foreground))]">{stats.users.total}</span></span>
            <span>Active (30d): <span className="font-semibold text-[hsl(var(--foreground))]">{stats.users.active}</span></span>
          </div>
        )}
      </div>
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
    </div>
  )
}

function UserDistributionSkeleton() {
  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Stat Cards Async Wrapper - Server component that awaits stats and passes to client component
 */
async function StatCardsAsyncWrapper({ statsPromise }: { statsPromise: Promise<any> }) {
  const stats = await statsPromise
  return <StatCardsWrapper stats={stats} />
}

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Quick Actions & Recent Activity - Static content
 */
function QuickActionsAndActivity() {
  const quickActions = [
    { label: 'Create Quiz', href: '/admin/quizzes/builder', icon: BookOpen },
    { label: 'Add Question', href: '/admin/questions/create', icon: Plus },
    { label: 'View Organisations', href: '/admin/organisations', icon: Building2 },
    { label: 'View Analytics', href: '/admin/analytics', icon: BarChart3 },
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quick Actions */}
      <div className="lg:col-span-1">
        <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 tracking-tight">
            Quick Actions
          </h2>
          <div className="space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 transition-colors group"
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
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">
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
  )
}

/**
 * Platform Health Component - Static content
 */
function PlatformHealth() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Platform Health */}
      <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 tracking-tight">
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
            <Badge variant="success">
              Healthy
            </Badge>
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
            <Badge variant="success">
              Healthy
            </Badge>
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
            <Badge variant="warning">
              Warning
            </Badge>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 tracking-tight">
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
  )
}
