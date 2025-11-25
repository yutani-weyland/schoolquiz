import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCustomQuizzesPageData } from './custom-quizzes-server'
import { CustomQuizzesClient } from './CustomQuizzesClient'
import { Skeleton } from '@/components/ui/Skeleton'

// Force dynamic rendering for user-specific data
export const dynamic = 'force-dynamic'

/**
 * Server Component - Custom Quizzes Page
 * Fetches data server-side and streams to client component
 */
export default async function MyCustomQuizzesPage() {
	const pageData = await getCustomQuizzesPageData()

	// Redirect if not premium
	if (!pageData.isPremium) {
		redirect('/premium')
	}

	return (
		<Suspense fallback={
			<div className="min-h-screen bg-white dark:bg-[#0F1419]">
				<div className="max-w-7xl mx-auto px-6 py-8">
					<div className="mb-8">
						<Skeleton className="h-8 w-64 mb-2" />
						<Skeleton className="h-4 w-96" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border">
								<Skeleton className="h-32 w-full rounded-xl mb-4" />
								<Skeleton className="h-4 w-full mb-2" />
								<Skeleton className="h-4 w-3/4 mb-4" />
								<Skeleton className="h-10 w-full rounded-full" />
							</div>
						))}
					</div>
				</div>
			</div>
		}>
			<CustomQuizzesClient initialData={pageData} />
		</Suspense>
	)
}
