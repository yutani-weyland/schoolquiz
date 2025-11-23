'use client'

import { Clock } from 'lucide-react'
import { AdminOverviewClient } from './AdminOverviewClient'

/**
 * Client component for clock display
 */
export function ClockDisplay() {
  return (
    <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
      <Clock className="w-4 h-4" />
      <AdminOverviewClient.Clock />
    </div>
  )
}

