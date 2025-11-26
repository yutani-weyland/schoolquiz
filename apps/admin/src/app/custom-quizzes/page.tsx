import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCustomQuizzesPageDataV2 } from './custom-quizzes-server-v2'
import { CustomQuizzesClient } from './CustomQuizzesClient'
import { CustomQuizzesShell } from './CustomQuizzesShell'
import { getCustomQuizzesContext } from './custom-quizzes-context-server'
import { Skeleton } from '@/components/ui/Skeleton'

// OPTIMIZATION: Allow caching - user-specific data is cached per user via cache keys
// Revalidate every 30 seconds for fresh data
export const revalidate = 30

/**
 * OPTIMIZATION: Server Component - Custom Quizzes Page
 * Uses summary queries for dramatically improved performance
 * Supports tab-based filtering (All/Mine/Shared/Groups/Organisation)
 */
export default async function MyCustomQuizzesPage({
	searchParams,
}: {
	searchParams?: Promise<{ tab?: string; search?: string }>
}) {
	// OPTIMIZATION: Next.js 15 requires awaiting searchParams
	const params = await searchParams
	// Get tab from URL (defaults to 'all')
	const tab = (params?.tab as any) || 'all'
	const searchQuery = params?.search || undefined

	// OPTIMIZATION: Fetch page data and context in parallel
	const [pageData, context] = await Promise.all([
		getCustomQuizzesPageDataV2(tab, {
			limit: 20,
			offset: 0,
			searchQuery,
		}),
		getCustomQuizzesContext(),
	])

	// Redirect if not premium
	if (!pageData.isPremium) {
		redirect('/premium')
	}

	// OPTIMIZATION: Server-rendered shell reduces client JS bundle
	// OPTIMIZATION: Granular Suspense boundaries allow better streaming
	// Each section can load independently - if one is ready, show it immediately
	return (
		<CustomQuizzesShell>
			<CustomQuizzesClient 
				initialData={pageData} 
				initialTab={tab}
				context={context}
			/>
		</CustomQuizzesShell>
	)
}
