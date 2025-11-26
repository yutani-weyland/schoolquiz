import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getProfileData, getSeasonStats, getUserAchievements } from './profile-server'
import { ProfileClient } from './ProfileClient'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageContainer } from '@/components/layout/PageContainer'

// Force dynamic rendering for user-specific data
export const dynamic = 'force-dynamic'

// Loading skeleton component
function ProfileSkeleton() {
  return (
    <PageLayout>
      <PageContainer maxWidth="6xl">
        <div className="space-y-6">
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
          <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
        </div>
      </PageContainer>
    </PageLayout>
  )
}

// Async component for fetching profile data
async function ProfileData({ userId, selectedSeason }: { userId?: string; selectedSeason: string }) {
  // Fetch all data in parallel
  const [profile, seasonStats, achievementsData] = await Promise.all([
    getProfileData(userId || ''),
    getSeasonStats(selectedSeason),
    getUserAchievements(),
  ])

  if (!profile) {
    redirect('/sign-in')
  }

  return (
    <ProfileClient
      initialProfile={profile}
      initialSeasonStats={seasonStats}
      initialAchievements={achievementsData.achievements}
      userId={userId}
      selectedSeason={selectedSeason}
    />
  )
}

interface PageProps {
  params: Promise<{ userId?: string }>
  searchParams: Promise<{ season?: string }>
}

export default async function ProfilePage({ params, searchParams }: PageProps) {
  const { userId } = await params
  const { season } = await searchParams
  const selectedSeason = season || '2025'

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      {/* @ts-expect-error Server Component */}
      <ProfileData userId={userId} selectedSeason={selectedSeason} />
    </Suspense>
  )
}
