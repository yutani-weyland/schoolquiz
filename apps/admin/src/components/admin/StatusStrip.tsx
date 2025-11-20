'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X, Loader2 } from 'lucide-react'
import { Button } from './ui/Button'

export type StatusStripVariant = 'info' | 'success' | 'warning' | 'error'

interface StatusStripProps {
  /** Type of alert */
  variant?: StatusStripVariant
  /** Main message */
  message: string
  /** Optional secondary details */
  details?: string
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Whether the strip can be dismissed */
  dismissible?: boolean
  /** Callback when dismissed */
  onDismiss?: () => void
  /** Show loading spinner */
  loading?: boolean
  /** Progress percentage (0-100) for loading states */
  progress?: number
}

const variantStyles: Record<StatusStripVariant, { bg: string; border: string; icon: typeof Info; iconColor: string }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: CheckCircle2,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: AlertCircle,
    iconColor: 'text-red-600 dark:text-red-400',
  },
}

export function StatusStrip({
  variant = 'info',
  message,
  details,
  action,
  dismissible = true,
  onDismiss,
  loading = false,
  progress,
}: StatusStripProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  const styles = variantStyles[variant]
  const Icon = styles.icon

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-xl p-4 mb-6 animate-in slide-in-from-top-2 duration-200`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {loading ? (
            <Loader2 className={`w-5 h-5 ${styles.iconColor} animate-spin`} />
          ) : (
            <Icon className={`w-5 h-5 ${styles.iconColor}`} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                variant === 'info' ? 'text-blue-900 dark:text-blue-100' :
                variant === 'success' ? 'text-green-900 dark:text-green-100' :
                variant === 'warning' ? 'text-amber-900 dark:text-amber-100' :
                'text-red-900 dark:text-red-100'
              }`}>
                {message}
              </p>
              {details && (
                <p className={`text-xs mt-1 ${
                  variant === 'info' ? 'text-blue-700 dark:text-blue-300' :
                  variant === 'success' ? 'text-green-700 dark:text-green-300' :
                  variant === 'warning' ? 'text-amber-700 dark:text-amber-300' :
                  'text-red-700 dark:text-red-300'
                }`}>
                  {details}
                </p>
              )}
              
              {/* Progress bar for loading states */}
              {loading && progress !== undefined && (
                <div className="mt-3 w-full bg-white/50 dark:bg-black/20 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      variant === 'info' ? 'bg-blue-500' :
                      variant === 'success' ? 'bg-green-500' :
                      variant === 'warning' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {action && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={action.onClick}
                  className={
                    variant === 'info' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/50' :
                    variant === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/50' :
                    variant === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/50' :
                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/50'
                  }
                >
                  {action.label}
                </Button>
              )}
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className={`p-1 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors ${
                    variant === 'info' ? 'text-blue-600 dark:text-blue-400' :
                    variant === 'success' ? 'text-green-600 dark:text-green-400' :
                    variant === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                    'text-red-600 dark:text-red-400'
                  }`}
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

