/**
 * Request deduplication utility
 * Prevents duplicate requests for the same URL within a short time window
 * 
 * This is a simple in-memory cache. For production, consider using React Query or SWR
 * which provide more sophisticated caching and deduplication.
 */

interface CachedRequest {
  promise: Promise<Response>
  timestamp: number
}

const requestCache = new Map<string, CachedRequest>()
const CACHE_TTL = 1000 // 1 second - dedupe requests within 1s

/**
 * Deduplicated fetch - if the same URL is requested within CACHE_TTL,
 * returns the cached promise instead of making a new request
 */
export function dedupeFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString()
  const cacheKey = `${url}:${JSON.stringify(init?.method || 'GET')}`

  const cached = requestCache.get(cacheKey)
  const now = Date.now()

  // Return cached promise if still valid
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.promise
  }

  // Create new request
  const promise = fetch(input, init).finally(() => {
    // Clean up cache after request completes (with small delay)
    setTimeout(() => {
      requestCache.delete(cacheKey)
    }, CACHE_TTL)
  })

  // Cache the promise
  requestCache.set(cacheKey, {
    promise,
    timestamp: now,
  })

  return promise
}

/**
 * Clear all cached requests (useful for testing or manual cache invalidation)
 */
export function clearFetchCache(): void {
  requestCache.clear()
}

