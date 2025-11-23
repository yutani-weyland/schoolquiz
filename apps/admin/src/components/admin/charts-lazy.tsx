/**
 * Lazy-loaded chart components for admin analytics pages
 * Code-split to reduce initial bundle size
 */

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/Skeleton'

// Loading skeleton for charts
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className={`h-[${height}px] w-full flex items-center justify-center bg-[hsl(var(--muted))] rounded-lg`}>
    <Skeleton className="h-full w-full" />
  </div>
)

// Lazy load recharts components for analytics pages
export const AnalyticsLineChart = dynamic(
  () => import('recharts').then(mod => ({
    default: ({ data, children, ...props }: any) => (
      <mod.ResponsiveContainer width="100%" height="100%">
        <mod.LineChart data={data} {...props}>
          {children}
        </mod.LineChart>
      </mod.ResponsiveContainer>
    )
  })),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={400} />,
  }
)

export const AnalyticsBarChart = dynamic(
  () => import('recharts').then(mod => ({
    default: ({ data, children, ...props }: any) => (
      <mod.ResponsiveContainer width="100%" height="100%">
        <mod.BarChart data={data} {...props}>
          {children}
        </mod.BarChart>
      </mod.ResponsiveContainer>
    )
  })),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={400} />,
  }
)

// Export recharts components for use in analytics pages
export const RechartsComponents = dynamic(
  () => import('recharts').then(mod => ({
    default: mod
  })),
  {
    ssr: false,
  }
)

