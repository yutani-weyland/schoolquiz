import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[hsl(var(--muted))]", className)}
      {...props}
    />
  )
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4 w-full",
            i === lines - 1 && "w-3/4" // Last line is shorter
          )}
        />
      ))}
    </div>
  )
}

interface SkeletonCardProps {
  className?: string;
}

function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-3xl p-7 sm:p-9 shadow-lg flex flex-col", className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-6 w-32" />
      </div>
      <Skeleton className="h-10 w-3/4 mb-5" />
      <div className="flex flex-wrap gap-2 mb-7">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="mt-auto flex items-center justify-between">
        <Skeleton className="h-12 w-32 rounded-full" />
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </div>
  )
}

/**
 * Achievement Card Skeleton - matches AchievementCard layout
 */
function AchievementCardSkeleton() {
  return (
    <div 
      className="rounded-2xl p-4 shadow-lg flex flex-col"
      style={{
        width: 'clamp(120px, 25vw, 200px)',
        maxWidth: '200px',
        aspectRatio: '5/8', // Match achievement card ratio
      }}
    >
      <Skeleton className="h-6 w-16 rounded-full mb-3" />
      <Skeleton className="h-8 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-auto" />
      <Skeleton className="h-3 w-20 mt-auto" />
    </div>
  )
}

/**
 * Leaderboard Card Skeleton - matches LeaderboardCard layout
 */
function LeaderboardCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  )
}

/**
 * Quiz Card Grid Skeleton - for quiz list pages
 */
function QuizCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/**
 * Page Header Skeleton - for page titles and descriptions
 */
function PageHeaderSkeleton() {
  return (
    <div className="text-center mb-8 space-y-4">
      <Skeleton className="h-12 w-full max-w-md mx-auto" />
      <Skeleton className="h-6 w-full max-w-lg mx-auto" />
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard,
  AchievementCardSkeleton,
  LeaderboardCardSkeleton,
  QuizCardGridSkeleton,
  PageHeaderSkeleton,
}

