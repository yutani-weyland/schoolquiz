import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton, QuizCardGridSkeleton } from '@/components/ui/Skeleton'

export default function QuizzesLoading() {
  return (
    <RouteLoading>
      <div className="max-w-[1600px] mx-auto px-6 sm:px-6 lg:px-8 xl:px-12">
        {/* Header skeleton - matches QuizzesShell layout */}
        <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-8 min-h-[1.2em] flex items-center justify-center">
          <Skeleton className="h-20 w-full max-w-md" />
        </div>
        <QuizCardGridSkeleton count={6} />
      </div>
    </RouteLoading>
  )
}

