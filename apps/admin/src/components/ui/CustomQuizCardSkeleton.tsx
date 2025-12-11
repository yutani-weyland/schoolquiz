/**
 * OPTIMIZATION: Custom Quiz Card Skeleton
 * Matches the exact layout of CustomQuizCard for instant perceived performance
 * User sees structure immediately, even before data loads
 */

import { Skeleton } from './Skeleton'

export function CustomQuizCardSkeleton() {
	return (
		<div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
			{/* Quiz Header - Color bar */}
			<Skeleton className="h-32 rounded-xl mb-4" />
			
			{/* Quiz Info */}
			<div className="mb-4">
				{/* Blurb */}
				<Skeleton className="h-4 w-full mb-2" />
				<Skeleton className="h-4 w-3/4 mb-2" />
				
				{/* Status and counts */}
				<div className="flex flex-wrap items-center gap-2 mb-2">
					<Skeleton className="h-5 w-20 rounded-full" />
					<Skeleton className="h-5 w-32 rounded-full" />
				</div>
				
				{/* Sharing indicators */}
				<div className="flex items-center gap-2">
					<Skeleton className="h-5 w-16 rounded-full" />
					<Skeleton className="h-5 w-20 rounded-full" />
				</div>
			</div>
			
			{/* Actions */}
			<div className="flex gap-2">
				<Skeleton className="h-10 flex-1 rounded-full" />
				<Skeleton className="h-10 flex-1 rounded-full" />
				<Skeleton className="h-10 w-10 rounded-full" />
			</div>
		</div>
	)
}

export function CustomQuizCardGridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{Array.from({ length: count }).map((_, i) => (
				<CustomQuizCardSkeleton key={i} />
			))}
		</div>
	)
}







