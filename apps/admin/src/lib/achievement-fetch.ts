/**
 * Shared utility for fetching achievement data with request deduplication
 * Prevents multiple simultaneous API calls for the same user's achievements
 */

// Global fetch cache to deduplicate requests
// Cache the parsed JSON data, not the Response object (Response body can only be read once)
const fetchCache = new Map<string, Promise<any>>();

/**
 * Fetch all achievements with user's unlock status
 * Multiple calls with the same userId will share the same fetch promise
 * Returns the parsed JSON data directly (not a Response object)
 * 
 * @param userId - User ID (required for authenticated users)
 * @param token - Deprecated: token is no longer used, session cookie is used instead
 */
export async function fetchAchievements(
  userId: string | null,
  token: string | null
): Promise<any> {
  if (!userId) {
    // Return empty achievements for visitors
    return { achievements: [], tier: 'visitor' };
  }

  // Create cache key based on userId
  const cacheKey = `achievements-${userId}`;
  
  // Check if there's already a pending request
  let fetchPromise = fetchCache.get(cacheKey);
  
  if (!fetchPromise) {
    // Create new fetch request and parse JSON immediately
    // Use session cookie instead of token
    fetchPromise = fetch('/api/achievements', {
      credentials: 'include', // Send session cookie
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
 * Multiple calls with the same userId will share the same fetch promise
 * Returns the parsed JSON data directly (not a Response object)
 * 
 * @param userId - User ID (required for authenticated users)
 * @param token - Deprecated: token is no longer used, session cookie is used instead
 */
export async function fetchUserAchievements(
  userId: string | null,
  token: string | null
): Promise<any> {
  if (!userId) {
    return { achievements: [] };
  }

  // Create cache key based on userId
  const cacheKey = `user-achievements-${userId}`;
  
  // Check if there's already a pending request
  let fetchPromise = fetchCache.get(cacheKey);
  
  if (!fetchPromise) {
    // Create new fetch request and parse JSON immediately
    // Use session cookie instead of token
    fetchPromise = fetch('/api/achievements/user', {
      credentials: 'include', // Send session cookie
    })
      .then(async (response) => {
        if (!response.ok) {
          // For 500 errors, return empty achievements instead of throwing
          // This prevents the UI from breaking when the API has issues
          if (response.status >= 500) {
            console.warn(`User Achievements API returned ${response.status}, returning empty achievements`);
            return { achievements: [] };
          }
          throw new Error(`User Achievements API error: ${response.status}`);
        }
        // Parse JSON once and cache the result
        return response.json();
      })
      .catch((error) => {
        // Catch any errors and return empty achievements to prevent UI breakage
        console.error('Error fetching user achievements:', error);
        return { achievements: [] };
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

