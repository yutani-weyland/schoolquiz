/**
 * Date formatting utilities for consistent date display across the admin area
 */

/**
 * Format a date for display in tables/lists
 * Shows relative time for recent dates, full date for older ones
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Never'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid date'
  
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  // Show relative time for recent dates
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  
  // Show full date for older dates
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

/**
 * Format a date with full timestamp
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Never'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid date'
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a date for tooltips (full date and time)
 */
export function formatDateTooltip(dateString: string | null | undefined): string {
  if (!dateString) return 'Never'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid date'
  
  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a date as a simple date string (no time)
 */
export function formatDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return 'Never'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid date'
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

