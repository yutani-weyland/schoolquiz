import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';

// Lazy load @nivo/heatmap - heavy library, only load when needed
const ResponsiveHeatMap = dynamic(
  () => import('@nivo/heatmap').then(mod => mod.ResponsiveHeatMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    ),
  }
);

interface HeatmapProps {
  data: { id: string; data: { x: string; y: number }[] }[];
  onCellClick?: (category: string, difficulty: string) => void;
}

export function Heatmap({ data, onCellClick }: HeatmapProps) {
  return (
    <div className="h-80 rounded-lg border bg-white dark:bg-gray-800 p-4">
      <ResponsiveHeatMap
        data={data}
        margin={{ top: 20, right: 20, bottom: 30, left: 80 }}
        valueFormat={v => `${Math.round(v)}%`}
        colors={{
          type: 'sequential',
          scheme: 'reds',
          minValue: 0,
          maxValue: 100
        }}
        axisLeft={{ tickSize: 0 }}
        axisBottom={{ tickSize: 0 }}
        inactiveOpacity={0.2}
        hoverTarget="cell"
        onClick={(cell) => {
          if (onCellClick) {
            onCellClick(cell.serieId, cell.data.x);
          }
        }}
        tooltip={({ cell }) => (
          <div className="rounded bg-slate-900 text-white text-xs px-2 py-1">
            {cell.serieId} · {cell.data.x}: <b>{cell.value}%</b>
          </div>
        )}
      />
    </div>
  );
}