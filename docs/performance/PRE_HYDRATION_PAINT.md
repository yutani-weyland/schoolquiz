# Pre-Hydration Paint Optimization

## Overview

Pre-Hydration Paint uses localStorage to cache rendered HTML content and paint it instantly before React hydrates. This makes pages appear to load instantly (0ms perceived latency) by showing cached content immediately.

**Impact:** Pages feel instant on repeat visits, dramatically improving perceived performance.

## How It Works

1. **First Visit:** Page renders normally, React caches the HTML in localStorage
2. **Subsequent Visits:** 
   - Inline script in `<head>` reads from localStorage
   - Paints cached HTML into container before React loads
   - React hydrates over cached content seamlessly
   - Fresh data loads in background and updates

## Implementation

### 1. Layout Files

Each page that uses pre-hydration paint has a layout file that injects the pre-paint script:

```tsx
// apps/admin/src/app/leagues/layout.tsx
import Script from 'next/script'
import { generatePreHydrationScript } from '@/lib/html-cache'

export default function LeaguesLayout({ children }) {
  const prePaintScript = generatePreHydrationScript('leagues', 'leagues-content')
  
  return (
    <>
      <Script
        id="leagues-pre-paint"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: prePaintScript }}
      />
      {children}
    </>
  )
}
```

### 2. PreHydrationPaint Component

Wrap content that should be cached:

```tsx
import { PreHydrationPaint } from '@/components/PreHydrationPaint'

<PreHydrationPaint cacheKey="leagues" containerId="leagues-content">
  <YourContent />
</PreHydrationPaint>
```

### 3. HTML Cache Utilities

The `html-cache.ts` utility provides:
- `cacheHTML(key, html)` - Cache HTML content
- `getCachedHTML(key)` - Retrieve cached HTML
- `generatePreHydrationScript(key, containerId)` - Generate inline script

## Current Implementation

### ✅ Implemented Pages

1. **Leagues Page** (`/leagues`)
   - Cache key: `leagues`
   - Container ID: `leagues-content`
   - Caches league grid content

2. **Custom Quizzes Page** (`/custom-quizzes`)
   - Cache key: `custom-quizzes`
   - Container ID: `custom-quizzes-content`
   - Caches quiz list content

## Cache Management

- **TTL:** 5 minutes (configurable)
- **Storage Key Format:** `schoolquiz-html-cache-{pageKey}`
- **Automatic Expiration:** Old caches are cleared automatically
- **Size Limit:** Browser localStorage limit (~5-10MB)

## Benefits

1. **Instant Perceived Load:** Pages appear instantly on repeat visits
2. **Better UX:** Users see content immediately, even on slow connections
3. **Reduced Bounce Rate:** Faster perceived load = better engagement
4. **Progressive Enhancement:** Falls back gracefully if cache unavailable

## Technical Details

### Cache Structure

```typescript
interface HTMLCacheEntry {
  html: string
  timestamp: number
  version?: string // Optional for cache invalidation
}
```

### Pre-Paint Script Flow

1. Script runs in `<head>` before React loads
2. Reads from localStorage: `schoolquiz-html-cache-{key}`
3. Validates cache age (< 5 minutes)
4. Injects HTML into container: `document.getElementById(containerId)`
5. Marks container with `data-cached="true"` attribute
6. React hydrates over cached content

### React Hydration

- React detects existing DOM content
- Hydrates seamlessly without flicker
- Updates content when fresh data arrives
- No hydration mismatches (content matches structure)

## Best Practices

1. **Cache Stable Content:** Only cache content that doesn't change frequently
2. **Avoid Sensitive Data:** Don't cache user-specific sensitive information
3. **Cache Size:** Keep cached HTML reasonable (< 100KB per page)
4. **Cache Invalidation:** Clear cache when content structure changes
5. **Progressive Enhancement:** Always work without cache

## Cache Invalidation

Clear cache when:
- Page structure changes significantly
- New features are added
- Breaking changes to content format

```typescript
import { clearCachedHTML } from '@/lib/html-cache'

// Clear specific page cache
clearCachedHTML('leagues')

// Clear all caches
clearAllHTMLCaches()
```

## Performance Metrics

Expected improvements:
- **FCP (First Contentful Paint):** ~200-500ms improvement
- **LCP (Largest Contentful Paint):** ~300-800ms improvement
- **Perceived Load Time:** Near-instant on repeat visits
- **Time to Interactive:** Unchanged (React still needs to hydrate)

## Browser Support

- **All Modern Browsers:** Full support
- **localStorage Required:** Falls back gracefully if unavailable
- **No JavaScript:** Falls back to normal rendering

## Future Enhancements

1. **Version-Based Invalidation:** Use version numbers to invalidate stale caches
2. **Compression:** Compress cached HTML to reduce storage
3. **IndexedDB:** Use IndexedDB for larger caches (>5MB)
4. **Service Worker:** Cache at network level for even faster loads
5. **Analytics:** Track cache hit rates and performance improvements







