import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCustomQuizzesPageDataV2 } from './custom-quizzes-server-v2'
import { CustomQuizzesClient } from './CustomQuizzesClient'
import { CustomQuizzesShell } from './CustomQuizzesShell'
import { getCustomQuizzesContext } from './custom-quizzes-context-server'
import { CustomQuizCardGridSkeleton } from '@/components/ui/CustomQuizCardSkeleton'
import type { TabType } from './custom-quizzes-summary-server'

// OPTIMIZATION: Allow caching - user-specific data is cached per user via cache keys
// Revalidate every 30 seconds for fresh data
export const revalidate = 30

/**
 * OPTIMIZATION: Server Component - Custom Quizzes Page
 * Uses summary queries for dramatically improved performance
 * Supports tab-based filtering (Shared with Me/Recent/Drafts/All)
 * OPTIMIZATION: Shell-first rendering - layout renders immediately, content streams in
 */
export default async function MyCustomQuizzesPage({
	searchParams,
}: {
	searchParams?: Promise<{ tab?: string; search?: string }>
}) {
	// OPTIMIZATION: Next.js 15 requires awaiting searchParams
	const params = await searchParams
	// Get tab from URL (defaults to 'all')
	const tab: TabType = (params?.tab as TabType) || 'all'
	const searchQuery = params?.search || undefined

	// OPTIMIZATION: Shell renders immediately, content streams in via Suspense
	// This improves LCP (Largest Contentful Paint) significantly
	return (
		<CustomQuizzesShell>
			<Suspense fallback={<CustomQuizCardGridSkeleton count={6} />}>
				{/* @ts-expect-error - Next.js App Router supports async Server Components in Suspense */}
				<CustomQuizzesPageContent tab={tab} searchQuery={searchQuery} />
			</Suspense>
		</CustomQuizzesShell>
	)
}

/**
 * OPTIMIZATION: Separate content component for Suspense streaming
 * This allows the shell to render immediately while data loads
 */
async function CustomQuizzesPageContent({ 
	tab, 
	searchQuery 
}: { 
	tab: TabType
	searchQuery?: string 
}) {
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

	return (
		<CustomQuizzesClient 
			initialData={pageData} 
			initialTab={tab}
			context={context}
		/>
	)
}
