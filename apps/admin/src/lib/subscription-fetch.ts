/**
 * Shared utility for fetching subscription data with request deduplication
 * Prevents multiple simultaneous API calls for the same user's subscription
 */

// Global fetch cache to deduplicate requests
// Cache the parsed JSON data, not the Response object (Response body can only be read once)
const fetchCache = new Map<string, Promise<any>>();

/**
 * Fetch subscription data with automatic request deduplication
 * Multiple calls with the same userId/token will share the same fetch promise
 * Returns the parsed JSON data directly (not a Response object)
 */
export async function fetchSubscription(userId: string | null, token: string | null): Promise<any> {
  if (!token) {
    throw new Error('No auth token provided');
  }

  // Create cache key based on userId and token prefix (first 20 chars for uniqueness)
  const cacheKey = `subscription-${userId || 'anonymous'}-${token.slice(0, 20)}`;
  
  // Check if there's already a pending request
  let fetchPromise = fetchCache.get(cacheKey);
  
  if (!fetchPromise) {
    // Create new fetch request and parse JSON immediately
    const headers: HeadersInit = { Authorization: `Bearer ${token}` };
    if (userId) {
      headers['X-User-Id'] = userId;
    }
    
    fetchPromise = fetch('/api/user/subscription', {
      headers,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Subscription API error: ${response.status}`);
        }
        // Parse JSON once and cache the result
        return response.json();
      })
      .finally(() => {
        // Remove from cache after request completes (success or failure)
        // Small delay to allow other components to use the same promise
        setTimeout(() => fetchCache.delete(cacheKey), 100);
      });
    
    fetchCache.set(cacheKey, fetchPromise);
  }
  
  return fetchPromise;
}

