import { LineChart, Line, ResponsiveContainer } from "recharts";

interface KpiCardProps {
  label: string;
  value: number | string;
  delta?: number;
  hint?: string;
  spark?: number[];
  ci?: { lo: number; hi: number };
  n?: number;
}

export function KpiCard({ label, value, delta, hint, spark, ci, n }: KpiCardProps) {
  const pos = typeof delta === "number" && delta > 0;
  const neg = typeof delta === "number" && delta < 0;
  
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-800 p-4">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
          {label}
          {hint && <span className="ml-1 font-normal opacity-75">· {hint}</span>}
        </div>
        {typeof delta === "number" && (
          <span className={pos ? "text-emerald-600 dark:text-emerald-400" : neg ? "text-rose-600 dark:text-rose-400" : "text-[hsl(var(--muted-foreground))]"}>
            {pos ? "▲" : neg ? "▼" : "•"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-1 text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {spark && (
        <div className="h-10 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spark.map((y, i) => ({ i, y }))}>
              <Line 
                type="monotone" 
                dataKey="y" 
                dot={false} 
                strokeWidth={2}
                stroke={pos ? "#10b981" : neg ? "#ef4444" : "#6b7280"}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {ci && n && (
        <div className="mt-1 text-xs font-normal text-[hsl(var(--muted-foreground))] opacity-75">
          CI: {ci.lo.toFixed(1)}-{ci.hi.toFixed(1)}% (n={n})
        </div>
      )}
    </div>
  );
}
