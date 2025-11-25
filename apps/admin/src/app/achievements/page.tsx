import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getAchievementsPageData } from './achievements-server'
import { AchievementsClient } from './AchievementsClient'
import { AchievementCardSkeleton, PageHeaderSkeleton } from '@/components/ui/Skeleton'

// Force dynamic rendering for user-specific data
export const dynamic = 'force-dynamic'

/**
 * Server Component - Achievements Page
 * Fetches data server-side and streams to client component
 */
export default async function AchievementsPage() {
	const pageData = await getAchievementsPageData()

	// For visitors, we'll let the client component handle the redirect/teaser
	// since it needs to check localStorage for legacy auth too

	return (
		<Suspense fallback={
			<div className="min-h-screen flex flex-col items-center px-6 pt-24 pb-16">
				<PageHeaderSkeleton />
				<div className="max-w-7xl mx-auto w-full px-4">
					<div className="flex flex-wrap justify-center gap-4">
						{Array.from({ length: 8 }).map((_, i) => (
							<AchievementCardSkeleton key={i} />
						))}
					</div>
				</div>
			</div>
		}>
			<AchievementsClient initialData={pageData} />
		</Suspense>
	)
}
