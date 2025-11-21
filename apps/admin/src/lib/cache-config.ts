/**
 * Centralized cache configuration for admin pages
 * 
 * Standardizes cache TTLs and provides consistent caching strategy
 */

/**
 * Cache TTLs in seconds
 */
export const CACHE_TTL = {
  // List pages - moderate freshness (30s)
  LIST: 30,
  
  // Detail pages - shorter cache for editable content (30s)
  DETAIL: 30,
  
  // Static/read-only content - longer cache (60s)
  STATIC: 60,
  
  // Analytics/stats - short cache for real-time feel (15s)
  STATS: 15,
  
  // Printable/export content - longer cache (60s)
  EXPORT: 60,
} as const

/**
 * Cache tags for revalidation
 * Use these with revalidateTag() to invalidate specific caches
 */
export const CACHE_TAGS = {
  QUIZZES: 'quizzes',
  QUIZ_DETAIL: (id: string) => `quiz-${id}`,
  STATS: 'stats',
  USERS: 'users',
  ORGANISATIONS: 'organisations',
} as const

/**
 * Helper to create cache key with consistent format
 */
export function createCacheKey(prefix: string, params: Record<string, string | number | undefined>): string[] {
  const sortedParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
  
  return [prefix, ...sortedParams]
}

