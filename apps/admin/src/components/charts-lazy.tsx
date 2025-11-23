/**
 * Lazy-loaded chart components
 * Code-split to reduce initial bundle size
 */

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/Skeleton'

// Loading skeleton for charts
const ChartSkeleton = () => (
  <div className="h-[300px] w-full flex items-center justify-center bg-[hsl(var(--muted))] rounded-lg">
    <Skeleton className="h-full w-full" />
  </div>
)

// Lazy load chart components
export const SubscriptionChart = dynamic(
  () => import('./charts').then(mod => ({ default: mod.SubscriptionChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

export const QuizCategoryChart = dynamic(
  () => import('./charts').then(mod => ({ default: mod.QuizCategoryChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

export const WeeklyUsageChart = dynamic(
  () => import('./charts').then(mod => ({ default: mod.WeeklyUsageChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

