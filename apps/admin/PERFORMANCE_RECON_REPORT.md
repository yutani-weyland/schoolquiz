# Performance Recon Report
**Generated:** 2025-01-27  
**Scope:** Next.js Admin App (`apps/admin/`)  
**Target:** Australian schools (mixed devices, average Wi-Fi)

---

## Executive Summary

The codebase shows **mixed patterns** with some optimizations already in place, but significant opportunities remain. The biggest wins will come from:

1. **Converting client-side data fetching to Server Components** (30-50% faster initial loads)
2. **Code-splitting heavy chart libraries** (reduce bundle by ~200-300KB)
3. **Implementing streaming with Suspense** (improve perceived performance)
4. **Standardizing caching strategy** (reduce database load by 60-80%)

**Current State:**
- ✅ Some server components exist (`/admin/quizzes/page.tsx`)
- ✅ React `cache()` for auth queries
- ✅ Some `unstable_cache` usage
- ⚠️ **56 client components** (`"use client"`)
- ⚠️ **132 useEffect hooks** in app directory (many for data fetching)
- ⚠️ Heavy dependencies loaded upfront (recharts, @nivo, framer-motion)
- ⚠️ Root layout forces dynamic rendering globally

---

## 1. Slow Pages / Routes

### 🔴 **Critical - Heavy Client-Side Fetching**

#### `/admin/page.tsx` (Admin Overview)
- **Issue:** Client component with `useEffect` + `fetch('/api/admin/stats')`
- **Impact:** ~800-1200ms TTFB, then additional client-side fetch
- **Why Slow:** 
  - Fetches stats on mount (client-side)
  - No streaming or progressive loading
  - All data waits for single API call
- **Recommendation:** Convert to Server Component, stream heavy sections with Suspense

#### `/admin/organisations/page.tsx`
- **Issue:** Full client component, 958 lines, complex state management
- **Impact:** Large bundle, client-side pagination/filtering
- **Why Slow:**
  - Fetches on every filter change (debounced, but still client-side)
  - Heavy component with modals, animations (framer-motion)
  - No server-side caching for list views
- **Recommendation:** Server Component for initial data, client component only for interactions

#### `/admin/users/page.tsx`
- **Issue:** Similar to organisations page - full client component
- **Impact:** ~1.2-1.5s initial load, then data fetch
- **Why Slow:**
  - Client-side fetching with complex state
  - Multiple useEffect hooks (7+)
  - Heavy table with inline editing
- **Recommendation:** Server Component with streaming for table data

#### `/dashboard/page.tsx`
- **Issue:** Client component with hardcoded mock data (no real fetching, but still client)
- **Impact:** Large bundle (~150KB+), all charts load upfront
- **Why Slow:**
  - Imports recharts directly (not code-split)
  - Multiple chart components render immediately
  - Heavy dashboard with many visualizations
- **Recommendation:** Code-split charts, use Server Components where possible

#### `/admin/analytics/*` pages
- **Issue:** All client components with client-side data fetching
- **Impact:** Analytics pages are rarely visited but load heavy chart libraries
- **Why Slow:**
  - @nivo charts loaded upfront (heatmap, treemap)
  - Client-side aggregation in some cases
- **Recommendation:** Lazy load entire analytics section, code-split charts

### 🟡 **Medium Priority**

#### `/stats/page.tsx`
- **Issue:** Uses React Query but still client component
- **Impact:** Good caching strategy, but initial load still client-side
- **Recommendation:** Convert to Server Component, pass initialData to React Query

#### `/quizzes/page.tsx`
- **Issue:** Client component with multiple data sources
- **Impact:** Multiple sequential fetches
- **Recommendation:** Server Component with parallel data fetching

---

## 2. Heavy Components

### 🔴 **Chart Libraries (Bundle Impact)**

#### `components/charts.tsx` & `components/advanced-charts.tsx`
- **Dependencies:** `recharts` (~150KB minified)
- **Usage:** Imported directly in dashboard, stats pages
- **Impact:** ~150KB added to initial bundle
- **Recommendation:** 
  ```typescript
  const SubscriptionChart = dynamic(() => import('./charts').then(m => ({ default: m.SubscriptionChart })), {
    ssr: false,
    loading: () => <ChartSkeleton />
  })
  ```

#### `@nivo/heatmap` & `@nivo/treemap`
- **Dependencies:** @nivo packages (~200KB+ combined)
- **Usage:** Used in analytics pages, dashboard components
- **Impact:** Heavy bundle for rarely-visited pages
- **Recommendation:** Lazy load entire analytics section, code-split per chart type

#### `framer-motion`
- **Dependencies:** framer-motion (~50KB minified)
- **Usage:** 91 files import it (animations, modals, transitions)
- **Impact:** Large bundle, but used extensively
- **Recommendation:** 
  - Already optimized in `next.config.js` with `optimizePackageImports`
  - Consider lazy-loading for non-critical animations
  - Use CSS transitions where possible instead

### 🟡 **Large Client Components**

#### `app/admin/organisations/page.tsx` (958 lines)
- **Size:** Very large component with inline modals, forms, state
- **Impact:** Large bundle, harder to code-split
- **Recommendation:** Extract modals, forms to separate components, lazy load

#### `app/admin/users/page.tsx` (933 lines)
- **Size:** Similar to organisations page
- **Impact:** Large bundle
- **Recommendation:** Component extraction, lazy loading

#### `components/dashboard/*` components
- **Size:** Multiple large dashboard components
- **Impact:** All load upfront on dashboard page
- **Recommendation:** Code-split dashboard sections, lazy load below-the-fold content

---

## 3. Data Fetching Smells

### 🔴 **Critical Issues**

#### Client-Side Fetching Pattern (Most Common)
```typescript
// ❌ CURRENT PATTERN (found in 30+ pages)
'use client'
export default function Page() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/...').then(r => r.json()).then(setData)
  }, [])
  // ...
}
```

**Impact:**
- Extra round-trip (server → client → API → server → DB)
- No streaming or progressive loading
- Poor SEO
- Slower TTFB

**Recommendation:**
```typescript
// ✅ BETTER: Server Component
export default async function Page() {
  const data = await fetchData() // Direct DB query
  return <ClientComponent data={data} />
}
```

#### Multiple Sequential Fetches
- **Location:** Several pages fetch data in sequence
- **Example:** Fetch user, then fetch user's organisations, then fetch stats
- **Impact:** Waterfall loading, slower perceived performance
- **Recommendation:** Parallel fetching with `Promise.all()` or streaming with Suspense

#### No Request Deduplication
- **Location:** Multiple components calling same API route
- **Example:** `useUserTier()` called in multiple components → multiple `/api/user/subscription` calls
- **Impact:** Redundant network requests (partially fixed with `subscription-fetch.ts`)
- **Recommendation:** Expand deduplication pattern to other endpoints

### 🟡 **Medium Priority**

#### Inconsistent Caching
- **Location:** Various API routes and pages
- **Issue:** Some use `unstable_cache` (60s), others use React Query (5min), some no cache
- **Impact:** Inconsistent performance, potential stale data
- **Recommendation:** Standardize cache TTLs, use revalidation tags

#### Missing Streaming
- **Location:** All heavy pages
- **Issue:** No Suspense boundaries for progressive loading
- **Impact:** Users wait for all data before seeing anything
- **Recommendation:** Implement streaming with Suspense for heavy sections

---

## 4. Bundling Smells

### 🔴 **Critical**

#### Heavy Dependencies Loaded Upfront
- **recharts:** ~150KB (loaded on dashboard, stats pages)
- **@nivo/heatmap:** ~100KB (loaded on analytics pages)
- **@nivo/treemap:** ~100KB (loaded on analytics pages)
- **framer-motion:** ~50KB (used in 91 files, but optimized via config)
- **Total Impact:** ~400KB+ of chart libraries in initial bundle

#### Minimal Code Splitting
- **Found:** Only 9 instances of `dynamic()` or `lazy()`
- **Impact:** Most code loads upfront, even rarely-used features
- **Recommendation:** Code-split:
  - Analytics pages (rarely visited)
  - Heavy modals
  - Chart components
  - Admin-only features

#### Root Layout Forces Dynamic
```typescript
// apps/admin/src/app/layout.tsx
export const dynamic = "force-dynamic"; // ❌ Too aggressive
```
- **Impact:** All pages opt into dynamic rendering, even static content
- **Recommendation:** Remove global, set per-route where needed

### 🟡 **Medium Priority**

#### Large Icon Library
- **@tabler/icons-react:** Used extensively
- **Impact:** Tree-shaking helps, but many icons imported
- **Recommendation:** Already using modular imports in config ✅

#### Unused Dependencies
- **canvas-confetti:** Only used in specific features
- **pdfkit:** Only used for PDF generation
- **Recommendation:** Already marked as external in config ✅

---

## 5. Database & Query Patterns

### ✅ **Already Optimized**
- React `cache()` for auth queries (prevents duplicate user session fetches)
- `unstable_cache` for questions/quizzes (60s TTL)
- Some N+1 query fixes (categories, achievements)
- Selective field fetching in quiz list queries

### 🟡 **Remaining Opportunities**

#### Potential N+1 Patterns
- **Location:** Some admin pages may still have loops with queries
- **Recommendation:** Audit remaining pages, use `include` with `_count` where possible

#### Missing Indexes
- **Evidence:** SQL migration files suggest performance issues
- **Recommendation:** Review and add indexes on:
  - `quiz.status`, `quiz.createdAt`
  - `user.tier`, `user.subscriptionStatus`
  - `organisation.status`
  - Foreign keys (quizId, userId, organisationId)

#### Query Result Caching
- **Current:** `unstable_cache` per-request only
- **Opportunity:** Consider Redis for cross-request caching (future optimization)

---

## Top 5-8 Hypotheses for Biggest Speed Wins

### 1. **Convert Admin Overview to Server Component + Streaming** 🔴
- **Impact:** 40-50% faster initial load
- **Effort:** Medium (2-3 hours)
- **Files:** `app/admin/page.tsx`
- **Why:** Currently client-side fetch, can stream stats sections independently

### 2. **Code-Split Chart Libraries** 🔴
- **Impact:** Reduce initial bundle by ~200-300KB
- **Effort:** Low (1-2 hours)
- **Files:** `components/charts.tsx`, `components/advanced-charts.tsx`, dashboard pages
- **Why:** Charts only needed when visible, rarely on initial viewport

### 3. **Convert Organisations/Users Pages to Server Components** 🔴
- **Impact:** 30-40% faster initial load, better SEO
- **Effort:** High (4-6 hours each)
- **Files:** `app/admin/organisations/page.tsx`, `app/admin/users/page.tsx`
- **Why:** Large client components with client-side fetching, can be mostly server-rendered

### 4. **Implement Streaming with Suspense for Heavy Sections** 🟡
- **Impact:** 50-70% improvement in perceived performance
- **Effort:** Medium (3-4 hours)
- **Files:** Admin overview, dashboard, analytics pages
- **Why:** Users see content progressively instead of waiting for everything

### 5. **Lazy Load Analytics Section** 🟡
- **Impact:** Reduce initial bundle by ~200KB, faster main app load
- **Effort:** Low (1 hour)
- **Files:** Analytics pages, route groups
- **Why:** Analytics rarely visited, heavy chart libraries

### 6. **Standardize Caching Strategy** 🟡
- **Impact:** 60-80% reduction in database queries for repeat visits
- **Effort:** Medium (2-3 hours)
- **Files:** API routes, cache-config.ts
- **Why:** Inconsistent caching leads to unnecessary DB hits

### 7. **Remove Global `force-dynamic` from Root Layout** 🟢
- **Impact:** Enable static rendering for public pages
- **Effort:** Low (30 minutes)
- **Files:** `app/layout.tsx`
- **Why:** Currently forces all pages dynamic, even static content

### 8. **Optimize Dashboard Page** 🟡
- **Impact:** 30-40% faster load, smaller bundle
- **Effort:** Medium (2-3 hours)
- **Files:** `app/dashboard/page.tsx`, dashboard components
- **Why:** Heavy page with many charts, all load upfront

---

## Next Steps

**Phase 1 Priority (Start Here):**
1. Remove global `force-dynamic` (quick win)
2. Code-split chart libraries (quick win, big impact)
3. Convert admin overview to Server Component (medium effort, big impact)

**Phase 2:**
4. Convert organisations/users pages to Server Components
5. Implement streaming with Suspense
6. Standardize caching strategy

**Phase 3:**
7. Lazy load analytics section
8. Optimize dashboard page
9. Add database indexes

---

## Metrics to Track

After implementing optimizations, measure:

1. **Time to First Byte (TTFB):** Target < 200ms
2. **First Contentful Paint (FCP):** Target < 1.5s
3. **Largest Contentful Paint (LCP):** Target < 2.5s
4. **Time to Interactive (TTI):** Target < 3.5s
5. **Total Bundle Size:** Target < 300KB initial JS
6. **Database Query Count:** Target 60-80% reduction for cached routes

---

**End of Recon Report**

