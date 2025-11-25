import { Suspense } from 'react'
import { getExploreQuizzesPageData } from './explore-quizzes-server'
import { ExploreQuizzesClient } from './ExploreQuizzesClient'
import { Skeleton } from '@/components/ui/Skeleton'

// Use ISR for caching - revalidate every hour since quiz data doesn't change frequently
// Note: For admin pages, we may want to keep dynamic, but ISR works well for public-facing data
export const revalidate = 3600
export const dynamic = 'force-dynamic' // Force dynamic for now since we need auth checks

/**
 * Server Component - Explore Quizzes Page
 * Fetches data server-side with ISR caching and streams to client component
 */
export default async function ExploreQuizzesPage() {
	// Fetch initial data server-side (no filters - client will handle filtering)
	const pageData = await getExploreQuizzesPageData()

  return (
		<Suspense fallback={
    <div className="min-h-screen bg-white dark:bg-[#0F1419]">
				<div className="pt-20 px-6">
          <div className="mb-8">
						<Skeleton className="h-8 w-64 mb-2" />
						<Skeleton className="h-4 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
						{Array.from({ length: 10 }).map((_, i) => (
							<div key={i} className="bg-white dark:bg-gray-800 rounded-lg border p-4">
								<Skeleton className="h-6 w-3/4 mb-2" />
								<Skeleton className="h-4 w-full mb-4" />
								<Skeleton className="h-8 w-full rounded-full" />
              </div>
            ))}
          </div>
              </div>
            </div>
		}>
			<ExploreQuizzesClient initialData={pageData} />
		</Suspense>
	)
}
