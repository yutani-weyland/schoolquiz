import React from 'react';
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface KPICardProps {
  title: string;
  value: string | number;
  trend: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    data: number[];
  };
  icon?: React.ReactNode;
  format?: 'number' | 'percentage' | 'currency';
  subtitle?: string;
}

export function KPICard({ title, value, trend, icon, format = 'number', subtitle }: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'percentage':
        return `${val}%`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up': return 'text-green-600 dark:text-green-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">
              {formatValue(value)}
            </p>
            <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
              <span>{getTrendIcon()}</span>
              <span>{Math.abs(trend.percentage)}%</span>
            </div>
          </div>
          {subtitle && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 font-normal">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-[hsl(var(--muted-foreground))] opacity-60">
            {icon}
          </div>
        )}
      </div>
      
      {/* Mini Sparkline */}
      <div className="h-12 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend.data}>
            <Area
              type="monotone"
              dataKey="value"
              stroke={trend.direction === 'up' ? '#10B981' : trend.direction === 'down' ? '#EF4444' : '#6B7280'}
              fill={trend.direction === 'up' ? '#10B981' : trend.direction === 'down' ? '#EF4444' : '#6B7280'}
              fillOpacity={0.1}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface ProgressRingProps {
  title: string;
  current: number;
  total: number;
  color?: string;
  subtitle?: string;
}

export function ProgressRing({ title, current, total, color = '#3B82F6', subtitle }: ProgressRingProps) {
  const percentage = Math.round((current / total) * 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-[hsl(var(--foreground))] tracking-tight">{percentage}%</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">{title}</p>
          <p className="text-lg font-bold text-[hsl(var(--foreground))] tracking-tight">
            {current.toLocaleString()} / {total.toLocaleString()}
          </p>
          {subtitle && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 font-normal">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
