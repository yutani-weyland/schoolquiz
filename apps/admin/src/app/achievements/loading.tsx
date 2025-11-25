import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton, AchievementCardSkeleton, PageHeaderSkeleton } from '@/components/ui/Skeleton'

export default function AchievementsLoading() {
  return (
    <RouteLoading>
      <div className="min-h-screen flex flex-col items-center px-6 pt-24 pb-16">
        <PageHeaderSkeleton />
        
        {/* Filters skeleton */}
        <div className="max-w-4xl mx-auto mb-8 w-full">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <Skeleton className="h-10 w-full max-w-md rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>
        
        {/* Achievement cards skeleton */}
        <div className="max-w-7xl mx-auto w-full px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <AchievementCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </RouteLoading>
  )
}

