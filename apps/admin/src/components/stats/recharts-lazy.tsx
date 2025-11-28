/**
 * Lazy-loaded recharts components for stats pages
 * OPTIMIZATION: Code-split recharts (~150KB) to reduce initial bundle size
 * Charts only load when stats pages are accessed
 */

'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';

// Loading skeleton for charts
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
	<div className="h-[300px] w-full flex items-center justify-center bg-[hsl(var(--muted))] rounded-lg">
		<Skeleton className="h-full w-full" />
	</div>
);

// Lazy load recharts components individually for better tree-shaking
export const BarChart = dynamic(
	() => import('recharts').then(mod => mod.BarChart),
	{ ssr: false, loading: () => <ChartSkeleton /> }
);

export const LineChart = dynamic(
	() => import('recharts').then(mod => mod.LineChart),
	{ ssr: false, loading: () => <ChartSkeleton /> }
);

export const AreaChart = dynamic(
	() => import('recharts').then(mod => mod.AreaChart),
	{ ssr: false, loading: () => <ChartSkeleton /> }
);

export const RadarChart = dynamic(
	() => import('recharts').then(mod => mod.RadarChart),
	{ ssr: false, loading: () => <ChartSkeleton /> }
);

export const PieChart = dynamic(
	() => import('recharts').then(mod => mod.PieChart),
	{ ssr: false, loading: () => <ChartSkeleton /> }
);

// Chart components (smaller, can load without skeleton)
export const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
export const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
export const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
export const Radar = dynamic(() => import('recharts').then(mod => mod.Radar), { ssr: false });
export const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
export const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
export const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
export const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
export const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
export const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
export const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
export const PolarGrid = dynamic(() => import('recharts').then(mod => mod.PolarGrid), { ssr: false });
export const PolarAngleAxis = dynamic(() => import('recharts').then(mod => mod.PolarAngleAxis), { ssr: false });
export const PolarRadiusAxis = dynamic(() => import('recharts').then(mod => mod.PolarRadiusAxis), { ssr: false });
// Legend component - use direct import as it's small and type-safe
export { Legend } from 'recharts';

