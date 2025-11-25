import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton, SkeletonText, PageHeaderSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <RouteLoading>
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <PageHeaderSkeleton />
        <div className="max-w-4xl mx-auto space-y-8">
          <SkeletonText lines={3} />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-12 w-48 rounded-full" />
            <Skeleton className="h-12 w-48 rounded-full" />
          </div>
        </div>
      </div>
    </RouteLoading>
  )
}

