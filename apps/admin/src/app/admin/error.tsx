/**
 * Error boundary for admin routes
 */
'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin route error:', error)
    }
  }, [error])

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center p-4">
      <div className="max-w-md w-full bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6 text-center space-y-6">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
            Something went wrong
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {error.message || 'An unexpected error occurred in the admin area'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-lg hover:bg-[hsl(var(--muted))]/80 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go to Overview
          </Link>
        </div>
      </div>
    </div>
  )
}

