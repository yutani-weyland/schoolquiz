import { Suspense } from 'react'
import { QuizzesShell } from './QuizzesShell'
import { QuizCardGridSkeleton } from '@/components/ui/Skeleton'
import QuizzesPageContent from './QuizzesPageContent'

// Allow caching - user-specific data is cached per user via cache keys
// Revalidate every 30 seconds for fresh completion data
export const revalidate = 30

/**
 * Server Component - Quizzes Page
 * OPTIMIZATION: Streams shell immediately, then loads data asynchronously
 * This improves LCP by rendering header/title without waiting for database queries
 * 
 * Note: TypeScript may show an error about async components in Suspense,
 * but Next.js App Router supports this pattern at runtime.
 */
export default function QuizzesPage() {
	// OPTIMIZATION: Stream shell immediately without waiting for data
	// This allows header + title to render immediately, improving LCP
	// Data fetching happens in Suspense boundaries below
	return (
		<QuizzesShell>
			<Suspense fallback={<QuizCardGridSkeleton count={6} />}>
				{/* @ts-expect-error - Next.js App Router supports async Server Components in Suspense */}
				<QuizzesPageContent />
			</Suspense>
		</QuizzesShell>
	)
}

