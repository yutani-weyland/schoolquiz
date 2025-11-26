import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getLeaderboardsPageDataV2 } from './leaderboards-summary-server'
import { LeaderboardsClient } from './LeaderboardsClient'
import { LeaderboardsShell } from './LeaderboardsShell'
import { LeaderboardCardGridSkeleton } from '@/components/ui/LeaderboardCardSkeleton'

/**
 * OPTIMIZATION: Server Component - Leaderboards Page
 * Uses summary queries for dramatically improved performance
 * KAHOOT-LIKE PERFORMANCE: Instant skeleton, minimal data transfer
 */
export default async function MyLeaderboardsPage() {
	const pageData = await getLeaderboardsPageDataV2()

	// Redirect visitors to sign in
	if (!pageData.isPremium && pageData.orgWide.length === 0) {
		redirect('/sign-in')
	}

	return (
		<LeaderboardsShell>
			<Suspense fallback={<LeaderboardCardGridSkeleton count={6} />}>
				<LeaderboardsClient initialData={pageData} />
			</Suspense>
		</LeaderboardsShell>
	)
}

