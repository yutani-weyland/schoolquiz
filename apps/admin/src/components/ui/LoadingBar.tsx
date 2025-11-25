'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LoadingBarProps {
  isLoading: boolean
  progress?: number // 0-100
  className?: string
  showPercentage?: boolean
}

export function LoadingBar({ 
  isLoading, 
  progress, 
  className,
  showPercentage = false 
}: LoadingBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    if (isLoading && progress !== undefined) {
      setDisplayProgress(progress)
    } else if (isLoading) {
      // Simulate progress if not provided
      const interval = setInterval(() => {
        setDisplayProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 200)
      return () => clearInterval(interval)
    } else {
      setDisplayProgress(100)
      setTimeout(() => setDisplayProgress(0), 300)
    }
  }, [isLoading, progress])

  if (!isLoading && displayProgress === 0) return null

  return (
    <div 
      className={cn("w-full", className)}
      role="progressbar"
      aria-valuenow={displayProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading progress"
    >
      <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-out"
          style={{ width: `${displayProgress}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-right">
          {Math.round(displayProgress)}%
        </p>
      )}
    </div>
  )
}

