/**
 * Loading skeleton for quiz play page
 */

export function QuizLoadingSkeleton() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
			<div className="text-center space-y-4">
				<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
				<p className="text-gray-600 dark:text-gray-400">Loading quiz...</p>
			</div>
		</div>
	);
}

