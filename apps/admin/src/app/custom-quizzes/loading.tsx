import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton, QuizCardGridSkeleton } from '@/components/ui/Skeleton'

export default function CustomQuizzesLoading() {
  return (
    <RouteLoading showFooter={false}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <QuizCardGridSkeleton count={6} />
      </div>
    </RouteLoading>
  )
}

