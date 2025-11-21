'use client'

import { motion } from 'framer-motion'

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

function SkeletonBar({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ 
        opacity: [0.6, 1, 0.6],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={`bg-[hsl(var(--muted))] rounded ${className}`}
    />
  )
}

export function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="p-6">
      {/* Header skeleton */}
      <div className="flex gap-4 pb-3 mb-3 border-b border-[hsl(var(--border))]">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBar key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonBar key={colIndex} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

