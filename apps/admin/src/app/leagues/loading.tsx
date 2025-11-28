import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton, PageHeaderSkeleton } from '@/components/ui/Skeleton'
import { LeaguesListSkeleton, LeagueDetailsSkeleton } from '@/components/leagues/LeaguesSkeleton'

export default function LeaguesLoading() {
  return (
    <RouteLoading>
      <div className="max-w-[1600px] mx-auto px-6 sm:px-6 lg:px-8 xl:px-12">
        {/* Header skeleton - matches Leagues page layout */}
        <PageHeaderSkeleton />
        
        {/* Action buttons skeleton */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        
        {/* Tabs skeleton */}
        <div className="mb-6 flex items-center justify-center">
          <Skeleton className="h-10 w-64 rounded-full" />
        </div>
        
        {/* Leagues grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <LeaguesListSkeleton />
          </div>
          <div className="lg:col-span-2">
            <LeagueDetailsSkeleton />
          </div>
        </div>
      </div>
    </RouteLoading>
  )
}

