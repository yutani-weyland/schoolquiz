import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton } from '@/components/ui/Skeleton'

export default function ExploreQuizzesLoading() {
  return (
    <RouteLoading showFooter={false}>
      <div className="max-w-full mx-auto px-6 pt-20">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        {/* Search and filters skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <Skeleton className="h-10 lg:col-span-2 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
        
        {/* Quiz grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-8 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </RouteLoading>
  )
}

