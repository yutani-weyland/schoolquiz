import { Skeleton } from './Skeleton'

/**
 * OPTIMIZATION: Leaderboard Card Skeleton - matches LeaderboardCard layout exactly
 * KAHOOT-LIKE PERFORMANCE: Accurate skeleton prevents layout shift
 */
export function LeaderboardCardSkeleton() {
	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
			{/* Header */}
			<div className="flex items-start justify-between mb-3">
				<div className="flex-1">
					<Skeleton className="h-5 w-3/4 mb-1" />
					<div className="flex gap-2 mb-2">
						<Skeleton className="h-5 w-20 rounded-full" />
						<Skeleton className="h-5 w-24 rounded-full" />
					</div>
				</div>
			</div>

			{/* Description */}
			<Skeleton className="h-4 w-full mb-4" />

			{/* Footer */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-8 w-20 rounded-full" />
			</div>
		</div>
	)
}

/**
 * Leaderboard Card Grid Skeleton - for leaderboard list pages
 */
export function LeaderboardCardGridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{Array.from({ length: count }).map((_, i) => (
				<LeaderboardCardSkeleton key={i} />
			))}
		</div>
	)
}







