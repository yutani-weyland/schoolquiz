import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton, PageHeaderSkeleton } from '@/components/ui/Skeleton'

export default function StatsLoading() {
  return (
    <RouteLoading>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
        <PageHeaderSkeleton />
        <div className="space-y-6">
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    </RouteLoading>
  )
}

