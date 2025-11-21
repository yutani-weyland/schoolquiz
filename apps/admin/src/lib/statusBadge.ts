/**
 * Standardized status badge utilities for consistent status display
 */

export type StatusBadgeVariant = 'info' | 'success' | 'warning' | 'error' | 'default'

export interface StatusBadgeConfig {
  variant: StatusBadgeVariant
  label: string
}

/**
 * Get status badge configuration for organisation status
 */
export function getOrganisationStatusBadge(status: string): StatusBadgeConfig {
  const statusMap: Record<string, StatusBadgeConfig> = {
    TRIALING: { variant: 'info', label: 'Trialing' },
    ACTIVE: { variant: 'success', label: 'Active' },
    PAST_DUE: { variant: 'warning', label: 'Past Due' },
    CANCELLED: { variant: 'default', label: 'Cancelled' },
    EXPIRED: { variant: 'error', label: 'Expired' },
  }
  
  return statusMap[status] || { variant: 'default', label: status }
}

/**
 * Get status badge configuration for member status
 */
export function getMemberStatusBadge(status: string): StatusBadgeConfig {
  const statusMap: Record<string, StatusBadgeConfig> = {
    ACTIVE: { variant: 'success', label: 'Active' },
    PENDING: { variant: 'info', label: 'Pending' },
    INACTIVE: { variant: 'default', label: 'Inactive' },
    SUSPENDED: { variant: 'warning', label: 'Suspended' },
  }
  
  return statusMap[status] || { variant: 'default', label: status }
}

/**
 * Get status badge configuration for user tier
 */
export function getUserTierBadge(tier: string): StatusBadgeConfig {
  const tierMap: Record<string, StatusBadgeConfig> = {
    premium: { variant: 'info', label: 'Premium' },
    basic: { variant: 'default', label: 'Basic' },
  }
  
  return tierMap[tier] || { variant: 'default', label: tier }
}

