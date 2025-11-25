import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton, LeaderboardCardSkeleton } from '@/components/ui/Skeleton'

export default function LeaderboardsLoading() {
  return (
    <RouteLoading showFooter={false}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        {/* Filters skeleton */}
        <div className="mb-6 flex gap-4">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        
        {/* Leaderboard cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LeaderboardCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </RouteLoading>
  )
}

