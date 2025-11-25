import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getLeaderboardsPageData } from './leaderboards-server'
import { LeaderboardsClient } from './LeaderboardsClient'
import { Skeleton } from '@/components/ui/Skeleton'

// Force dynamic rendering for user-specific data
export const dynamic = 'force-dynamic'

/**
 * Server Component - Leaderboards Page
 * Fetches data server-side and streams to client component
 */
export default async function MyLeaderboardsPage() {
	const pageData = await getLeaderboardsPageData()

	// Redirect visitors to sign in
	if (!pageData.isPremium && pageData.leaderboards.orgWide.length === 0) {
		redirect('/sign-in')
	}

	return (
		<Suspense fallback={
			<div className="min-h-screen bg-white dark:bg-[#0F1419]">
				<div className="max-w-7xl mx-auto px-6 py-8">
					<div className="mb-8">
						<div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
						<div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
								<Skeleton className="h-5 w-3/4 mb-3" />
								<Skeleton className="h-4 w-full mb-4" />
								<div className="flex items-center justify-between">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-8 w-20 rounded-full" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		}>
			<LeaderboardsClient initialData={pageData} />
		</Suspense>
	)
}

