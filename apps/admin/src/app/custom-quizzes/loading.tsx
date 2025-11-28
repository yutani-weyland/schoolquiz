import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton, PageHeaderSkeleton } from '@/components/ui/Skeleton'
import { CustomQuizCardGridSkeleton } from '@/components/ui/CustomQuizCardSkeleton'

export default function CustomQuizzesLoading() {
  return (
    <RouteLoading showFooter={false}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeaderSkeleton />
        <CustomQuizCardGridSkeleton count={6} />
      </div>
    </RouteLoading>
  )
}

