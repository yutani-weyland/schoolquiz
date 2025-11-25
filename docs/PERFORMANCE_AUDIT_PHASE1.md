# Performance Audit - Phase 1: UX & Technique Review
**Generated:** 2025-01-27  
**Based on:** Phase 0 Discovery findings

---

## Review Methodology

For each customer-facing page, we assess:
1. **Load order / perceived performance** - Is content visible quickly?
2. **Modern patterns** - Streaming, Suspense, lazy loading
3. **Loading feedback** - Skeletons, spinners, progress indicators
4. **Accessibility** - ARIA attributes, semantic HTML

---

## Per-Page Analysis & Recommendations

### 1. Landing Page (`/`)

**Current State:**
- Client component with artificial 100ms delay
- Entire page blocks on `contentLoaded` state
- Uses skeletons but only for initial render
- Heavy sections (QuizCardStack, ReasonsCarousel) wait for state

**Issues / Risks:**
- 🔴 **Artificial delay** - 100ms timeout to show skeleton (bad UX)
- 🔴 **Blocking load** - All content waits for `contentLoaded`
- 🟡 **No streaming** - Can't show content progressively
- 🟡 **Client-side only** - No server-side rendering benefits
- 🟡 **Heavy sections not deferred** - All animations load together

**Recommended Changes (Priority Order):**

**HIGH Priority:**
1. **Remove artificial delay** - Use real loading states based on actual data fetching
2. **Convert to Server Component** - Render static content server-side
3. **Add `loading.tsx`** - Create route-level loading skeleton
4. **Stream heavy sections** - Use Suspense for QuizCardStack, ReasonsCarousel, Achievement preview

**MEDIUM Priority:**
5. **Lazy load animations** - Defer Framer Motion animations below fold
6. **Progressive image loading** - Lazy load achievement card images
7. **Optimize hero section** - Render hero immediately, defer rest

**LOW Priority:**
8. **Add loading bar** - For page transitions
9. **Optimize font loading** - Already using `next/font` (good!)

**Example Implementation:**
```tsx
// apps/admin/src/app/loading.tsx
export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">
        <div className="min-h-screen flex flex-col items-center justify-center">
          <Skeleton className="h-32 w-3/4 mb-8" />
          <SkeletonText lines={3} className="mb-8" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-48 rounded-full" />
            <Skeleton className="h-12 w-48 rounded-full" />
          </div>
        </div>
      </main>
    </>
  )
}
```

---

### 2. Quizzes Page (`/quizzes`)

**Current State:**
- Client component with 300ms artificial delay
- Batch API call for completions (good!)
- Uses `SkeletonCard` for quiz grid
- Blocks on auth check before showing content

**Issues / Risks:**
- 🔴 **Artificial delay** - 300ms timeout
- 🔴 **Blocks on auth** - Entire page waits for auth check
- 🟡 **No streaming** - All quizzes load together
- 🟡 **Client-side fetching** - Could be server-side
- 🟡 **No route-level loading** - Uses component-level skeleton

**Recommended Changes (Priority Order):**

**HIGH Priority:**
1. **Remove artificial delay** - Use real auth state
2. **Add `loading.tsx`** - Route-level skeleton for entire page
3. **Convert to Server Component** - Fetch quiz list server-side
4. **Stream quiz grid** - Use Suspense boundary around quiz list

**MEDIUM Priority:**
5. **Parallel auth + data fetch** - Don't block on auth check
6. **Optimize completion fetching** - Keep batch call, but make it non-blocking
7. **Add skeleton for title** - Match final layout exactly

**LOW Priority:**
8. **Virtual scrolling** - For large quiz lists (if needed)
9. **Optimistic updates** - For completion status

**Example Implementation:**
```tsx
// apps/admin/src/app/quizzes/loading.tsx
export default function QuizzesLoading() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen pt-24">
        <div className="max-w-[1600px] mx-auto px-6">
          <Skeleton className="h-20 w-full max-w-md mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
```

---

### 3. Quiz Intro Page (`/quizzes/[slug]/intro`)

**Current State:**
- Client component with hardcoded data
- Inline script prevents background flash (good!)
- No loading state needed (data is static)

**Issues / Risks:**
- 🟡 **Hardcoded data** - Should fetch from database
- 🟢 **No loading needed** - Data is immediate

**Recommended Changes (Priority Order):**

**MEDIUM Priority:**
1. **Convert to Server Component** - Fetch quiz metadata server-side
2. **Add `loading.tsx`** - Skeleton for quiz intro layout
3. **Stream quiz data** - Use Suspense if fetching from DB

**LOW Priority:**
4. **Optimize background color** - Keep inline script (works well)

---

### 4. Quiz Play Page (`/quizzes/[slug]/play`)

**Current State:**
- ✅ **Server Component** (good!)
- Fetches quiz data server-side
- Has `QuizLoadingSkeleton` component
- No `loading.tsx` file
- No Suspense boundary

**Issues / Risks:**
- 🔴 **No route-level loading** - Missing `loading.tsx` file
- 🔴 **Blocks until data loads** - No streaming
- 🟡 **Has skeleton but doesn't use it** - `QuizLoadingSkeleton` exists but not used
- 🟡 **No progressive loading** - All quiz data loads at once

**Recommended Changes (Priority Order):**

**HIGH Priority:**
1. **Add `loading.tsx`** - Use `QuizLoadingSkeleton` as fallback
2. **Add Suspense boundary** - Stream quiz data progressively
3. **Use existing skeleton** - `QuizLoadingSkeleton` is already created!

**MEDIUM Priority:**
4. **Stream rounds** - Load rounds one at a time if quiz is large
5. **Optimize ISR** - Current `revalidate: 3600` is good, keep it

**Example Implementation:**
```tsx
// apps/admin/src/app/quizzes/[slug]/play/loading.tsx
import { QuizLoadingSkeleton } from '@/components/quiz/QuizLoadingSkeleton'

export default function QuizPlayLoading() {
  return <QuizLoadingSkeleton />
}
```

---

### 5. Account Page (`/account`)

**Current State:**
- Client component
- Full-page spinner while `tierLoading`
- Tab content loads on selection
- No skeleton components

**Issues / Risks:**
- 🔴 **Full-page spinner** - Blocks entire UI
- 🔴 **No skeleton** - Just spinner, doesn't match final layout
- 🟡 **Client-side only** - Could fetch tier server-side
- 🟡 **Tabs block on load** - Each tab waits for data

**Recommended Changes (Priority Order):**

**HIGH Priority:**
1. **Replace spinner with skeleton** - Match account page layout
2. **Add `loading.tsx`** - Route-level skeleton
3. **Convert to Server Component** - Fetch user/tier data server-side
4. **Stream tab content** - Use Suspense for each tab

**MEDIUM Priority:**
5. **Lazy load tabs** - Only load tab content when selected
6. **Optimize tier check** - Cache tier status

**Example Skeleton:**
```tsx
// Account page skeleton should match:
// - Header with title
// - Tab switcher (4 tabs)
// - Tab content area (card with form/fields)
```

---

### 6. Achievements Page (`/achievements`)

**Current State:**
- Client component
- Fetches achievements from API
- No loading state shown
- "Loading..." text in subtitle only
- No skeleton for achievement cards

**Issues / Risks:**
- 🔴 **No visual loading state** - Cards just appear
- 🔴 **No skeleton** - Empty space while loading
- 🟡 **Client-side fetching** - Could be server-side
- 🟡 **All achievements load at once** - Could stream

**Recommended Changes (Priority Order):**

**HIGH Priority:**
1. **Add achievement card skeleton** - Match card layout
2. **Add `loading.tsx`** - Route-level skeleton
3. **Show skeleton grid** - While achievements fetch
4. **Convert to Server Component** - Fetch achievements server-side

**MEDIUM Priority:**
5. **Stream achievements** - Load in batches
6. **Progressive image loading** - Lazy load achievement images
7. **Optimize filter/search** - Client-side is fine for filtering

**Example Skeleton:**
```tsx
// Achievement card skeleton should match:
// - Card dimensions (clamp(120px, 25vw, 200px))
// - Card shape (aspect ratio)
// - Rarity badge area
// - Title area
```

---

### 7. Leaderboards Page (`/leaderboards`)

**Current State:**
- Client component
- Simple text loading ("Loading leaderboards...")
- No skeleton for leaderboard cards
- Full-page loading blocks UI

**Issues / Risks:**
- 🔴 **No skeleton** - Just text, doesn't match layout
- 🔴 **Full-page blocking** - Entire UI blocked
- 🟡 **Client-side fetching** - Could be server-side

**Recommended Changes (Priority Order):**

**HIGH Priority:**
1. **Add leaderboard card skeleton** - Match card layout
2. **Add `loading.tsx`** - Route-level skeleton
3. **Show skeleton grid** - While leaderboards fetch
4. **Convert to Server Component** - Fetch leaderboards server-side

**MEDIUM Priority:**
5. **Stream leaderboards** - Load by section (org-wide, group, ad-hoc)
6. **Optimize filter/search** - Keep client-side

---

### 8. Stats Page (`/stats`)

**Current State:**
- ✅ **Server Component with Suspense** (excellent!)
- ✅ Custom `StatsSkeleton` component
- ✅ Suspense boundary with fallback
- ✅ Skeleton matches final layout

**Issues / Risks:**
- 🟢 **Already well-optimized!** - This is the gold standard
- 🟡 **Could add more granular Suspense** - Stream individual charts

**Recommended Changes (Priority Order):**

**LOW Priority (Already Good!):**
1. **Add granular Suspense** - Stream each chart independently
2. **Lazy load charts** - If charts are heavy
3. **Optimize chart loading** - Already using lazy loading

**This page is a good reference for other pages!**

---

### 9. Leagues Page (`/leagues`)

**Current State:**
- Client component with React Query
- ✅ Uses `LeaguesListSkeleton` and `LeagueDetailsSkeleton`
- ✅ Caching for instant initial render
- ✅ Dynamic import for DnD Kit
- ✅ Good patterns overall!

**Issues / Risks:**
- 🟡 **Client-side only** - Could benefit from Server Component for initial data
- 🟡 **React Query is good** - But could combine with Server Component

**Recommended Changes (Priority Order):**

**MEDIUM Priority:**
1. **Hybrid approach** - Server Component for initial data, React Query for updates
2. **Add `loading.tsx`** - Route-level skeleton (uses existing skeletons)
3. **Stream league details** - When league is selected

**LOW Priority:**
4. **Optimize DnD Kit loading** - Already lazy-loaded (good!)

**This page has good patterns - use as reference!**

---

### 10. Custom Quizzes Page (`/custom-quizzes`)

**Current State:**
- Client component
- Uses `Promise.all` for parallel fetching (good!)
- Basic loading state
- No skeleton for quiz cards

**Issues / Risks:**
- 🔴 **No skeleton** - Just loading state
- 🟡 **Client-side fetching** - Could be server-side
- 🟢 **Parallel fetching** - Good pattern!

**Recommended Changes (Priority Order):**

**HIGH Priority:**
1. **Add quiz card skeleton** - Match custom quiz card layout
2. **Add `loading.tsx`** - Route-level skeleton
3. **Convert to Server Component** - Fetch quizzes server-side
4. **Keep parallel fetching** - Use `Promise.all` server-side too

**MEDIUM Priority:**
5. **Stream quiz grid** - Use Suspense
6. **Optimize usage widget** - Load separately

---

### 11. Explore Quizzes Page (`/explore-quizzes`)

**Current State:**
- Client component
- Spinner while loading
- Re-fetches on filter/sort changes
- No skeleton for quiz grid

**Issues / Risks:**
- 🔴 **No skeleton** - Just spinner
- 🔴 **Full-page blocking** - Entire UI blocked
- 🟡 **Client-side fetching** - Could be server-side
- 🟡 **Re-fetches on every filter** - Could optimize

**Recommended Changes (Priority Order):**

**HIGH Priority:**
1. **Add quiz card skeleton** - Match explore quiz card layout
2. **Add `loading.tsx`** - Route-level skeleton
3. **Convert to Server Component** - Fetch quizzes server-side
4. **Server-side filtering** - Move filter logic to server

**MEDIUM Priority:**
5. **Optimize re-fetching** - Debounce or use React Query
6. **Stream quiz grid** - Use Suspense

---

### 12. Dashboard Page (`/dashboard`)

**Current State:**
- Client component
- Hardcoded mock data (no real fetching)
- Lazy-loaded charts (good!)
- No loading states needed (mock data)

**Issues / Risks:**
- 🟡 **Mock data** - Not real implementation
- 🟢 **Lazy-loaded charts** - Good pattern!

**Recommended Changes (Priority Order):**

**MEDIUM Priority (When Real Data Added):**
1. **Add skeleton for KPI cards** - When real data fetching added
2. **Add skeleton for charts** - While charts load
3. **Convert to Server Component** - When real data added
4. **Stream sections** - Use Suspense for each section

---

### 13. About Page (`/about`)

**Current State:**
- Client component
- Static content
- No data fetching
- Smooth animations

**Issues / Risks:**
- 🟢 **No issues** - Static content, no loading needed
- 🟢 **Good animations** - Framer Motion works well

**Recommended Changes:**
- ✅ **No changes needed** - This page is fine as-is

---

## Cross-Cutting Issues

### 1. Missing Route-Level Loading Files

**Issue:** Only `apps/admin/src/app/admin/loading.tsx` exists. No `loading.tsx` files for customer-facing routes.

**Impact:** Users see blank screens or inconsistent loading states during navigation.

**Recommendation:**
- Create `loading.tsx` for each route segment that fetches data
- Use existing skeleton components where possible
- Match skeleton layout to final page layout

**Routes Needing `loading.tsx`:**
- `/quizzes/loading.tsx`
- `/quizzes/[slug]/play/loading.tsx`
- `/account/loading.tsx`
- `/achievements/loading.tsx`
- `/leaderboards/loading.tsx`
- `/stats/loading.tsx` (already has Suspense, but could add route-level)
- `/leagues/loading.tsx`
- `/custom-quizzes/loading.tsx`
- `/explore-quizzes/loading.tsx`

---

### 2. Artificial Delays

**Issue:** Landing page (100ms) and Quizzes page (300ms) use `setTimeout` to show skeletons.

**Impact:** 
- Slower perceived performance
- Unnecessary delays
- Poor UX

**Recommendation:**
- Remove all artificial delays
- Use real loading states based on actual data fetching
- Show skeletons immediately while data loads

---

### 3. Inconsistent Loading Patterns

**Issue:** Mix of skeletons, spinners, text-only, and no loading states.

**Impact:** Inconsistent user experience across pages.

**Recommendation:**
- Standardize on skeleton components for all data-loading pages
- Use spinners only for inline actions (button clicks, form submissions)
- Create missing skeleton variants (table rows, list items, charts)

---

### 4. Client-Side Data Fetching Dominance

**Issue:** 90%+ of pages are client components fetching data client-side.

**Impact:**
- Slower initial loads
- Extra JavaScript bundle
- Poor SEO
- Hydration overhead

**Recommendation:**
- Convert data-fetching pages to Server Components
- Keep client components only for:
  - Interactive UI (modals, forms, real-time updates)
  - Client-side filtering/sorting (after initial server render)
  - Animations and transitions

**Priority Pages for Server Component Conversion:**
1. `/quizzes` - High traffic, public-facing
2. `/achievements` - User-specific data
3. `/leaderboards` - User-specific data
4. `/custom-quizzes` - Premium feature
5. `/explore-quizzes` - Could be static with ISR

---

### 5. Missing Skeleton Components

**Issue:** Some pages need skeletons that don't exist.

**Missing Skeletons:**
- Achievement card skeleton
- Leaderboard card skeleton
- Table row skeleton
- Chart skeleton
- Form skeleton
- List item skeleton

**Recommendation:**
- Create missing skeleton variants
- Add to `apps/admin/src/components/ui/Skeleton.tsx` or separate file
- Reuse across pages

---

### 6. No Streaming / Progressive Loading

**Issue:** Most pages block until all data loads.

**Impact:** Users wait for entire page, even if some sections could load independently.

**Recommendation:**
- Use Suspense boundaries for independent sections
- Stream heavy sections (charts, lists, stats) separately
- Show page shell immediately, stream content progressively

**Example Pattern (from `/stats` page):**
```tsx
<Suspense fallback={<StatsSkeleton />}>
  <StatsData />
</Suspense>
```

---

## Accessibility Issues

### Current State:
- ⚠️ Loading states lack ARIA attributes
- ⚠️ No `aria-busy` on loading elements
- ⚠️ No `aria-live` regions for dynamic content
- ⚠️ Spinners lack `role="status"`

### Recommendations:

1. **Add ARIA attributes to skeletons:**
```tsx
<div aria-busy="true" aria-live="polite" role="status">
  <SkeletonCard />
</div>
```

2. **Add ARIA to spinners:**
```tsx
<div className="spinner" role="status" aria-label="Loading">
  <span className="sr-only">Loading content...</span>
</div>
```

3. **Add ARIA to loading states:**
```tsx
{isLoading && (
  <div aria-busy="true" aria-live="polite">
    <Skeleton />
  </div>
)}
```

---

## Consistency Issues

### Design System:
- ✅ Skeleton components exist and are consistent
- ⚠️ Some pages use custom skeletons (should use shared components)
- ⚠️ Spinner styles vary across pages

### Recommendations:

1. **Standardize skeleton usage:**
   - Use `Skeleton`, `SkeletonCard`, `SkeletonText` from `@/components/ui/Skeleton`
   - Create new variants in same file if needed
   - Don't create page-specific skeletons unless layout is unique

2. **Standardize spinner:**
   - Create shared `Spinner` component
   - Use consistent size variants (sm, md, lg)
   - Match design system colors

3. **Standardize loading patterns:**
   - Route-level `loading.tsx` for page loads
   - Suspense boundaries for streaming sections
   - Inline spinners for actions (button clicks)

---

## Summary of Recommendations by Priority

### 🔴 HIGH Priority (Immediate Impact)

1. **Remove artificial delays** (Landing, Quizzes pages)
2. **Add route-level `loading.tsx` files** (9 routes)
3. **Convert high-traffic pages to Server Components** (Quizzes, Achievements, Leaderboards)
4. **Add missing skeleton components** (Achievement cards, Leaderboard cards)
5. **Add Suspense boundaries** (Quiz Play, Quizzes, Achievements)

### 🟡 MEDIUM Priority (Significant Impact)

6. **Convert remaining pages to Server Components** (Account, Custom Quizzes, Explore)
7. **Stream heavy sections** (Charts, lists, stats)
8. **Standardize loading patterns** (Skeletons, spinners, ARIA)
9. **Optimize parallel fetching** (More `Promise.all` usage)

### 🟢 LOW Priority (Nice to Have)

10. **Add granular Suspense** (Stream individual components)
11. **Virtual scrolling** (For large lists)
12. **Optimistic updates** (For mutations)
13. **Loading bars** (For page transitions)

---

## Next Steps (Phase 2)

Phase 2 will create a detailed implementation plan:
- Shared primitives to create/enhance
- Per-page modification plan
- Migration order and strategy
- Code examples for each change

