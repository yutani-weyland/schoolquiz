/**
 * HTML Cache Utilities
 * 
 * Caches rendered HTML content in localStorage for instant paint before React hydration.
 * This makes pages appear to load instantly by showing cached content immediately.
 */

const CACHE_PREFIX = 'schoolquiz-html-cache-'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export interface HTMLCacheEntry {
  html: string
  timestamp: number
  version?: string // Optional version for cache invalidation
}

/**
 * Cache HTML content for a page
 */
export function cacheHTML(pageKey: string, html: string, version?: string): void {
  if (typeof window === 'undefined') return

  try {
    const entry: HTMLCacheEntry = {
      html,
      timestamp: Date.now(),
      version,
    }
    localStorage.setItem(`${CACHE_PREFIX}${pageKey}`, JSON.stringify(entry))
  } catch (error) {
    // localStorage might be full or unavailable - silently fail
    console.warn(`Failed to cache HTML for ${pageKey}:`, error)
  }
}

/**
 * Get cached HTML content for a page
 */
export function getCachedHTML(pageKey: string, maxAge: number = CACHE_TTL): string | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${pageKey}`)
    if (!cached) return null

    const entry: HTMLCacheEntry = JSON.parse(cached)
    const age = Date.now() - entry.timestamp

    // Check if cache is still valid
    if (age > maxAge) {
      localStorage.removeItem(`${CACHE_PREFIX}${pageKey}`)
      return null
    }

    return entry.html
  } catch {
    return null
  }
}

/**
 * Clear cached HTML for a page
 */
export function clearCachedHTML(pageKey: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`${CACHE_PREFIX}${pageKey}`)
}

/**
 * Clear all HTML caches
 */
export function clearAllHTMLCaches(): void {
  if (typeof window === 'undefined') return

  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.warn('Failed to clear HTML caches:', error)
  }
}

/**
 * Generate inline script for pre-hydration paint
 * This script runs before React loads and paints cached HTML
 */
export function generatePreHydrationScript(pageKey: string, containerId: string): string {
  return `
(function() {
  try {
    var cacheKey = '${CACHE_PREFIX}${pageKey}';
    var cached = localStorage.getItem(cacheKey);
    if (!cached) return;
    
    var entry = JSON.parse(cached);
    if (!entry || !entry.html) return;
    
    var age = Date.now() - entry.timestamp;
    var maxAge = ${CACHE_TTL};
    
    // Check if cache is still valid
    if (age > maxAge) {
      localStorage.removeItem(cacheKey);
      return;
    }
    
    // Wait for DOM to be ready, then try to find container
    function tryPaint() {
      var container = document.getElementById('${containerId}');
      if (container) {
        // Only paint if container is empty (hasn't been rendered by React yet)
        if (!container.innerHTML || container.innerHTML.trim().length === 0) {
          container.innerHTML = entry.html;
          container.setAttribute('data-cached', 'true');
        }
      } else {
        // Container doesn't exist yet - try again after a short delay
        // But only try a few times to avoid infinite loops
        if (typeof tryPaint.attempts === 'undefined') {
          tryPaint.attempts = 0;
        }
        tryPaint.attempts++;
        if (tryPaint.attempts < 10) {
          setTimeout(tryPaint, 50);
        }
      }
    }
    
    // Try immediately, then fallback to DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryPaint);
    } else {
      tryPaint();
    }
  } catch (e) {
    // Silently fail - React will render normally
  }
})();
  `.trim()
}

