/**
 * Beautiful skeleton loading components for leagues page
 */

export function LeaguesListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-20 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse"
        >
          <div className="h-full p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600/50" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600/50 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600/50 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function LeagueDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* League Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 space-y-3">
            <div className="h-8 bg-gray-200 dark:bg-gray-700/50 rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700/50 rounded w-1/2 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700/50 rounded-full animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700/50 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="h-14 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
      </div>

      {/* Members List Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="h-6 bg-gray-200 dark:bg-gray-700/50 rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600/50" />
                <div className="space-y-1.5">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600/50 rounded w-24" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-600/50 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

