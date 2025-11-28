import { Suspense } from 'react'
import { getAchievementsPageData } from './achievements-server'
import { AchievementsClient } from './AchievementsClient'
import { AchievementsShell } from './AchievementsShell'
import { AchievementCardSkeleton } from '@/components/ui/Skeleton'

// Allow caching - user-specific data is cached per user via cache keys
// Revalidate every 60 seconds for fresh achievement data
export const revalidate = 60

/**
 * Server Component - Achievements Page
 * OPTIMIZATION: Streams shell immediately, then loads data asynchronously
 * This improves LCP by rendering header/title without waiting for database queries
 * 
 * Note: TypeScript may show an error about async components in Suspense,
 * but Next.js App Router supports this pattern at runtime.
 */
export default function AchievementsPage() {
	// OPTIMIZATION: Stream shell immediately without waiting for data
	// This allows header + title to render immediately, improving LCP
	// Data fetching happens in Suspense boundaries below
	return (
		<AchievementsShell>
			<Suspense fallback={
				<div className="max-w-7xl mx-auto w-full px-4">
					<div className="flex flex-wrap justify-center gap-4">
						{Array.from({ length: 8 }).map((_, i) => (
							<AchievementCardSkeleton key={i} />
						))}
					</div>
				</div>
			}>
				{/* @ts-expect-error - Next.js App Router supports async Server Components in Suspense */}
				<AchievementsPageContent />
			</Suspense>
		</AchievementsShell>
	)
}

/**
 * OPTIMIZATION: Separate async Server Component for data fetching
 * Wrapped in Suspense so shell can render immediately
 * This component can be async and will be streamed when data is ready
 */
async function AchievementsPageContent() {
	const pageData = await getAchievementsPageData()

	// For visitors, redirect to home or show teaser (handled in client component)
	// Server-side redirect removed to allow streaming shell first

	return <AchievementsClient initialData={pageData} />
}
