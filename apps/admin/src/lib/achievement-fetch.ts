/**
 * Shared utility for fetching achievement data with request deduplication
 * Prevents multiple simultaneous API calls for the same user's achievements
 */

// Global fetch cache to deduplicate requests
// Cache the parsed JSON data, not the Response object (Response body can only be read once)
const fetchCache = new Map<string, Promise<any>>();

/**
 * Fetch all achievements with user's unlock status
 * Multiple calls with the same userId/token will share the same fetch promise
 * Returns the parsed JSON data directly (not a Response object)
 */
export async function fetchAchievements(
  userId: string | null,
  token: string | null
): Promise<any> {
  if (!token) {
    // Return empty achievements for visitors
    return { achievements: [], tier: 'visitor' };
  }

  // Create cache key based on userId and token prefix
  const cacheKey = `achievements-${userId || 'anonymous'}-${token.slice(0, 20)}`;
  
  // Check if there's already a pending request
  let fetchPromise = fetchCache.get(cacheKey);
  
  if (!fetchPromise) {
    // Create new fetch request and parse JSON immediately
    const headers: HeadersInit = { Authorization: `Bearer ${token}` };
    if (userId) {
      headers['X-User-Id'] = userId;
    }
    
    fetchPromise = fetch('/api/achievements', {
      headers,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Achievements API error: ${response.status}`);
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

/**
 * Fetch user's achievements with progress
 * Multiple calls with the same userId/token will share the same fetch promise
 * Returns the parsed JSON data directly (not a Response object)
 */
export async function fetchUserAchievements(
  userId: string | null,
  token: string | null
): Promise<any> {
  if (!token || !userId) {
    return { achievements: [] };
  }

  // Create cache key based on userId and token prefix
  const cacheKey = `user-achievements-${userId}-${token.slice(0, 20)}`;
  
  // Check if there's already a pending request
  let fetchPromise = fetchCache.get(cacheKey);
  
  if (!fetchPromise) {
    // Create new fetch request and parse JSON immediately
    const headers: HeadersInit = { 
      Authorization: `Bearer ${token}`,
      'X-User-Id': userId,
    };
    
    fetchPromise = fetch('/api/achievements/user', {
      headers,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`User Achievements API error: ${response.status}`);
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

