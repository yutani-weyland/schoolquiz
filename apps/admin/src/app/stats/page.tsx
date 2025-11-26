import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getStatsData } from './stats-server'
import { getCurrentUser } from '@/lib/auth'
import { StatsClient } from './StatsClient'
import { LockedFeature } from '@/components/access/LockedFeature'
import { SiteHeader } from '@/components/SiteHeader'
import { Footer } from '@/components/Footer'

// Force dynamic rendering for user-specific data
export const dynamic = 'force-dynamic'

// Loading skeleton component
function StatsSkeleton() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white dark:bg-[#0F1419] text-gray-900 dark:text-white pt-24 sm:pt-32 pb-16 px-4 sm:px-8 overflow-visible">
        <div className="max-w-6xl mx-auto overflow-visible">
          <div className="text-center mb-8 sm:mb-12">
            <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse mb-4 max-w-md mx-auto" />
            <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse max-w-lg mx-auto" />
          </div>
          <div className="space-y-6">
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </main>
      <Footer />
    </>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
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

  // Fetch stats data
  const stats = await getStatsData()

  return (
    <StatsClient 
      initialData={stats || undefined} 
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
