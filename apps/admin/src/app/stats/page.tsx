import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getStatsDataCritical, getStatsDataDeferred } from './stats-server'
import { getCurrentUser } from '@/lib/auth'
import { StatsClient } from './StatsClient'
import { LockedFeature } from '@/components/access/LockedFeature'
import { SiteHeader } from '@/components/SiteHeader'
import { Footer } from '@/components/Footer'
import { RouteLoading } from '@/components/ui/RouteLoading'
import { PageHeaderSkeleton } from '@/components/ui/Skeleton'

// Force dynamic rendering for user-specific data
export const dynamic = 'force-dynamic'

// Loading skeleton component - uses RouteLoading for consistency
function StatsSkeleton() {
  return (
    <RouteLoading>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
        <PageHeaderSkeleton />
        <div className="space-y-6">
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    </RouteLoading>
  )
}

// Async component for fetching stats data
async function StatsData() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Check if user is premium
  // Premium if tier is "premium" OR subscription is active
  const isPremium = user.tier === 'premium' || 
    (user.subscriptionStatus === 'ACTIVE' || user.subscriptionStatus === 'TRIALING') ||
    (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date()) ||
    (user.tier === null && process.env.NODE_ENV !== 'production') // Allow in dev

  if (!isPremium) {
    return (
      <>
        <SiteHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LockedFeature
            tierRequired="premium"
            onUpgradeClick={() => window.location.href = '/upgrade'}
          >
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Premium Stats Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Unlock detailed analytics and insights with Premium
                </p>
              </div>
            </div>
          </LockedFeature>
        </div>
        <Footer />
      </>
    )
  }

  // Phase 2: Optimize streaming - fetch critical data immediately
  // Deferred data is passed as a Promise to enable React streaming
  const criticalStats = await getStatsDataCritical()
  const deferredDataPromise = getStatsDataDeferred() // Don't await - let React stream it

  return (
    <StatsClient 
      initialCriticalData={criticalStats || undefined}
      deferredDataPromise={deferredDataPromise}
      isPremium={isPremium}
    />
  )
}

export default async function StatsPage() {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      {/* @ts-expect-error - Async Server Component */}
      <StatsData />
    </Suspense>
  )
}
