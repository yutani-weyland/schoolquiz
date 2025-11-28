'use client'

import { useEffect, useRef, useState } from 'react'
import { cacheHTML } from '@/lib/html-cache'

interface PreHydrationPaintProps {
  /**
   * Unique key for this page's cache (e.g., 'leagues', 'custom-quizzes')
   */
  cacheKey: string
  
  /**
   * ID of the container element where cached HTML will be painted
   */
  containerId: string
  
  /**
   * Children to render - this content will be cached
   */
  children: React.ReactNode
}

/**
 * PreHydrationPaint component
 * 
 * Caches rendered HTML content in localStorage so it can be painted
 * instantly on next page load before React hydrates.
 * 
 * This component is completely optional - if caching fails, it just renders children normally.
 * 
 * Usage:
 * ```tsx
 * <PreHydrationPaint cacheKey="leagues" containerId="leagues-content">
 *   <YourContent />
 * </PreHydrationPaint>
 * ```
 */
export function PreHydrationPaint({ cacheKey, containerId, children }: PreHydrationPaintProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [wasPaintedFromCache, setWasPaintedFromCache] = useState(false)
  const cacheTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasMountedRef = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // On first mount, check if content was painted from cache
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      
      try {
        const wasCached = container.getAttribute('data-cached') === 'true'
        if (wasCached) {
          setWasPaintedFromCache(true)
          container.removeAttribute('data-cached')
          // Don't cache again - we're hydrating over cached content
          return
        }
      } catch (error) {
        // If anything fails, just continue normally
        console.warn('PreHydrationPaint: Error checking cache status', error)
      }
    }

    // Only cache if we didn't hydrate over cached content
    if (wasPaintedFromCache) return

    // Clear any existing timeout
    if (cacheTimeoutRef.current) {
      clearTimeout(cacheTimeoutRef.current)
    }

    // Cache the HTML after content stabilizes
    cacheTimeoutRef.current = setTimeout(() => {
      try {
        if (!container || wasPaintedFromCache) return
        
        const html = container.innerHTML
        // Only cache substantial content (avoid loading states)
        if (html && html.trim().length > 200 && !html.includes('Loading')) {
          cacheHTML(cacheKey, html)
        }
      } catch (error) {
        // Silently fail - caching is optional and shouldn't break the page
      }
    }, 2000) // Wait 2s for content to fully stabilize

    return () => {
      if (cacheTimeoutRef.current) {
        clearTimeout(cacheTimeoutRef.current)
      }
    }
  }, [cacheKey, containerId, wasPaintedFromCache, children])

  // Always render children - caching is completely optional
  return (
    <div id={containerId} ref={containerRef}>
      {children}
    </div>
  )
}

