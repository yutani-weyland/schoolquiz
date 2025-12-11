import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton } from '@/components/ui/Skeleton'
import { FormSkeleton } from '@/components/admin/ui/skeletons'

export default function AccountLoading() {
  return (
    <RouteLoading showFooter={false}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          
          {/* Tab switcher skeleton */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-full">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 flex-1 rounded-full" />
            ))}
          </div>
          
          {/* Tab content skeleton */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border">
            <FormSkeleton />
          </div>
        </div>
      </div>
    </RouteLoading>
  )
}







