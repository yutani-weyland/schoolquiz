import { redirect } from 'next/navigation'
import { getQuizzesPageData } from './quizzes-server'
import { QuizzesClient } from './QuizzesClient'
import { getCachedOfficialQuizzes } from './quizzes-page-data'

/**
 * OPTIMIZATION: Separate async Server Component for data fetching
 * Wrapped in Suspense so shell can render immediately
 * This component can be async and will be streamed when data is ready
 */
export default async function QuizzesPageContent() {
	// OPTIMIZATION: Fetch official quizzes and page data in parallel (they're independent)
	// This reduces time-to-first-byte by fetching both simultaneously
	const [quizzes, pageData] = await Promise.all([
		getCachedOfficialQuizzes(),
		getQuizzesPageData(),
	])

	// For visitors, redirect to latest quiz intro (use first quiz slug or fallback)
	if (!pageData.isLoggedIn) {
		const latestQuizSlug = quizzes[0]?.slug || '12'
		redirect(`/quizzes/${latestQuizSlug}/intro`)
	}

	// OPTIMIZATION: Granular Suspense boundaries allow better streaming
	// Each section can load independently - if one is ready, show it immediately
	return <QuizzesClient initialData={pageData} quizzes={quizzes} />
}

