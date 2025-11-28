# Performance Audit - Phase 0: Discovery
**Generated:** 2025-01-27  
**Scope:** Customer-facing routes in `apps/admin/src/app/`

---

## Customer-Facing Routes Inventory

### Public Routes (No Auth Required)

| Route | Component | Purpose | Auth |
|-------|-----------|---------|------|
| `/` | `page.tsx` | Landing page / marketing | Public |
| `/quizzes` | `quizzes/page.tsx` | Quiz grid / browse | Public (redirects if not logged in) |
| `/quizzes/[slug]/intro` | `quizzes/[slug]/intro/page.tsx` | Quiz intro page | Public |
| `/quizzes/[slug]/play` | `quizzes/[slug]/play/page.tsx` | Quiz player | Public |
| `/demo` | `demo/page.tsx` | Demo quiz | Public |
| `/about` | `about/page.tsx` | About page | Public |
| `/sign-in` | `sign-in/page.tsx` | Sign in form | Public |
| `/sign-up` | `sign-up/page.tsx` | Sign up form | Public |
| `/premium` | `premium/page.tsx` | Premium features page | Public |
| `/upgrade` | `upgrade/page.tsx` | Upgrade page | Public |
| `/help` | `help/page.tsx` | Help page | Public |
| `/contact` | `contact/page.tsx` | Contact page | Public |

### Authenticated Routes

| Route | Component | Purpose | Auth |
|-------|-----------|---------|------|
| `/dashboard` | `dashboard/page.tsx` | Teacher dashboard | Authenticated |
| `/account` | `account/page.tsx` | Account settings | Authenticated |
| `/achievements` | `achievements/page.tsx` | Achievement gallery | Authenticated |
| `/stats` | `stats/page.tsx` | Stats dashboard | Premium |
| `/leaderboards` | `leaderboards/page.tsx` | Leaderboard list | Authenticated |
| `/leagues` | `leagues/page.tsx` | Private leagues | Premium |
| `/custom-quizzes` | `custom-quizzes/page.tsx` | Custom quiz list | Premium |
| `/custom-quizzes/create` | `custom-quizzes/create/page.tsx` | Create custom quiz | Premium |
| `/custom-quizzes/[id]/play` | `custom-quizzes/[id]/play/page.tsx` | Play custom quiz | Premium |
| `/premium/my-quizzes` | `premium/my-quizzes/page.tsx` | My custom quizzes | Premium |
| `/premium/create-quiz` | `premium/create-quiz/page.tsx` | Create quiz (premium) | Premium |
| `/explore-quizzes` | `explore-quizzes/page.tsx` | Explore all quizzes | Authenticated |
| `/question-bank` | `question-bank/page.tsx` | Question bank | Authenticated |
| `/create-quiz` | `create-quiz/page.tsx` | Create quiz | Authenticated |
| `/profile/[userId]` | `profile/[userId]/page.tsx` | User profile | Authenticated |

---

## Per-Page Analysis

### 1. Landing Page (`/`)

**File:** `apps/admin/src/app/page.tsx`

**Data Fetching:**
- Client component (`"use client"`)
- Uses `useUserAccess()` hook (reads from localStorage + API)
- Client-side redirect logic for logged-in users
- No server-side data fetching

**Load Order:**
1. Header (`SiteHeader`) renders immediately
2. Hero section with conditional skeleton (100ms delay)
3. Content sections render progressively with `contentLoaded` state
4. Heavy sections (QuizCardStack, ReasonsCarousel, Achievement preview) wait for `contentLoaded`

**Loading UX:**
- ✅ Uses `Skeleton` and `SkeletonText` components
- ✅ Custom skeleton for hero title (80px height placeholder)
- ✅ Skeleton for description text (3 lines)
- ✅ Skeleton for buttons (2 button placeholders)
- ⚠️ Artificial 100ms delay (`setTimeout`) to show skeleton
- ⚠️ Entire page blocks on `contentLoaded` state
- ⚠️ No streaming - all content waits for client-side state

**Techniques:**
- Framer Motion animations for progressive reveal
- Conditional rendering based on `contentLoaded` state
- Client-side only (no Server Components)

---

### 2. Quizzes Page (`/quizzes`)

**File:** `apps/admin/src/app/quizzes/page.tsx`

**Data Fetching:**
- Client component (`"use client"`)
- Uses `useUserAccess()`, `useSession()`, `useUserTier()` hooks
- Client-side auth check with redirect
- Fetches quiz completions via `/api/quiz/completions/batch` (batch API call - good!)
- Fetches custom quizzes via `/api/premium/custom-quizzes` when viewType is 'custom'

**Load Order:**
1. Header renders immediately
2. Title shows skeleton while checking auth (300ms delay)
3. Quiz grid shows skeleton cards (6 cards) while loading
4. Data fetches in parallel (completions batch call)

**Loading UX:**
- ✅ Uses `SkeletonCard` component for quiz grid
- ✅ Title skeleton (80px height)
- ✅ Staggered skeleton animations (50ms delay per card)
- ⚠️ Artificial 300ms delay to show skeleton
- ⚠️ Entire page blocks on auth check
- ⚠️ No streaming - waits for all data before showing content

**Techniques:**
- Batch API call for completions (efficient!)
- Conditional skeleton based on `isLoading` state
- Framer Motion for card animations
- Client-side only

---

### 3. Quiz Intro Page (`/quizzes/[slug]/intro`)

**File:** `apps/admin/src/app/quizzes/[slug]/intro/page.tsx`

**Data Fetching:**
- Client component (`"use client"`)
- Hardcoded quiz data (no API call)
- Client-side redirect if quiz not found

**Load Order:**
1. Inline script sets background color immediately (prevents flash)
2. `QuizIntro` component renders with quiz data

**Loading UX:**
- ❌ No loading state - quiz data is hardcoded
- ✅ Inline script prevents background color flash
- ⚠️ No skeleton or loading indicator

**Techniques:**
- Inline script for immediate background color
- Client-side only

---

### 4. Quiz Play Page (`/quizzes/[slug]/play`)

**File:** `apps/admin/src/app/quizzes/[slug]/play/page.tsx`

**Data Fetching:**
- ✅ **Server Component** (async function)
- Fetches quiz data from database via Prisma
- Falls back to mock data if DB unavailable
- Uses `transformQuizToPlayFormat` transformer

**Load Order:**
1. Server fetches quiz data
2. Renders `QuizPlayerWrapper` with data
3. Client component handles interactivity

**Loading UX:**
- ⚠️ No `loading.tsx` file for this route
- ⚠️ No Suspense boundary
- ⚠️ Page blocks until quiz data is fetched
- ✅ Has `QuizLoadingSkeleton` component (used in demo page)
- ❌ Not used in play page

**Techniques:**
- Server Component (good!)
- Static generation with ISR (`revalidate: 3600`)
- Error boundary wrapper
- No streaming or progressive loading

---

### 5. Account Page (`/account`)

**File:** `apps/admin/src/app/account/page.tsx`

**Data Fetching:**
- Client component (`"use client"`)
- Uses `useSession()` and `useUserTier()` hooks
- Client-side redirect if not authenticated
- Tab components fetch their own data

**Load Order:**
1. Page shell renders
2. Shows spinner while `tierLoading` is true
3. Tab content loads when selected

**Loading UX:**
- ✅ Custom spinner component (8x8 border spinner)
- ✅ "Loading..." text
- ⚠️ Full-page spinner blocks entire page
- ⚠️ No skeleton - just spinner
- ⚠️ No streaming

**Techniques:**
- Client-side only
- Tab-based lazy loading (tabs load on selection)
- No skeleton components

---

### 6. Achievements Page (`/achievements`)

**File:** `apps/admin/src/app/achievements/page.tsx`

**Data Fetching:**
- Client component (`"use client"`)
- Fetches achievements from `/api/achievements` in `useEffect`
- Uses multiple hooks: `useUserTier()`, `useUserAccess()`
- Checks localStorage for premium status

**Load Order:**
1. Header renders immediately
2. Title and filters render
3. Achievement cards show after API call completes
4. Visitor state shows immediately (different UI)

**Loading UX:**
- ⚠️ No loading state shown - cards just appear when data arrives
- ⚠️ No skeleton for achievement cards
- ⚠️ "Loading..." text in subtitle (line 638) but no visual indicator
- ⚠️ Empty state only shown after data loads

**Techniques:**
- Client-side only
- Framer Motion for card animations
- No skeleton or progressive loading

---

### 7. Leaderboards Page (`/leaderboards`)

**File:** `apps/admin/src/app/leaderboards/page.tsx`

**Data Fetching:**
- Client component (`"use client"`)
- Fetches from `/api/my-leaderboards` in `useEffect`
- Uses `useUserTier()` hook

**Load Order:**
1. Page shell renders
2. Shows "Loading leaderboards..." text
3. Leaderboard cards appear after fetch

**Loading UX:**
- ⚠️ Simple text loading state ("Loading leaderboards...")
- ⚠️ No skeleton for leaderboard cards
- ⚠️ Full-page loading blocks entire UI

**Techniques:**
- Client-side only
- No skeleton components
- Basic loading state

---

### 8. Stats Page (`/stats`)

**File:** `apps/admin/src/app/stats/page.tsx`

**Data Fetching:**
- ✅ **Server Component** with Suspense!
- Uses `getCurrentUser()` and `getStatsData()` server-side
- Wrapped in `<Suspense>` with custom `StatsSkeleton` fallback

**Load Order:**
1. `StatsSkeleton` shows immediately (header + content skeletons)
2. Server fetches user and stats data
3. `StatsClient` component renders with data

**Loading UX:**
- ✅ Custom `StatsSkeleton` component
- ✅ Suspense boundary with fallback
- ✅ Skeleton matches final layout (header, cards, charts)
- ✅ Server Component pattern

**Techniques:**
- Server Component (excellent!)
- Suspense with custom skeleton
- Progressive loading via Suspense
- Good example to follow!

---

### 9. Leagues Page (`/leagues`)

**File:** `apps/admin/src/app/leagues/page.tsx`

**Data Fetching:**
- Client component (`"use client"`)
- Uses React Query (`useQuery`) for data fetching
- Fetches from `fetchLeagues()` function
- Uses caching (`getCachedLeagues`, `cacheLeagues`)
- Dynamic import for DnD Kit (`DraggableLeaguesList`)

**Load Order:**
1. Uses cached leagues for instant initial render
2. React Query fetches fresh data in background
3. Shows skeleton while loading

**Loading UX:**
- ✅ Uses `LeaguesListSkeleton` and `LeagueDetailsSkeleton`
- ✅ Dynamic import with skeleton fallback
- ✅ Caching for instant initial render
- ✅ React Query for background refetch

**Techniques:**
- React Query with caching
- Dynamic imports with loading fallback
- Skeleton components
- Good pattern!

---

### 10. Custom Quizzes Page (`/custom-quizzes`)

**File:** `apps/admin/src/app/custom-quizzes/page.tsx`

**Data Fetching:**
- Client component (`"use client"`)
- Fetches from `/api/premium/custom-quizzes` and `/api/premium/custom-quizzes/usage`
- Uses `Promise.all` for parallel fetching (good!)

**Load Order:**
1. Redirects if not premium
2. Shows loading state
3. Fetches quizzes and usage in parallel
4. Renders quiz grid

**Loading UX:**
- ⚠️ Basic loading state (`loading` boolean)
- ⚠️ No skeleton for quiz cards
- ⚠️ No visual loading indicator shown in code snippet

**Techniques:**
- `Promise.all` for parallel fetching (good!)
- Client-side only
- No skeleton components visible

---

### 11. Explore Quizzes Page (`/explore-quizzes`)

**File:** `apps/admin/src/app/explore-quizzes/page.tsx`

**Data Fetching:**
- Client component (`"use client"`)
- Fetches from `/api/admin/quizzes` in `useEffect`
- Re-fetches on filter/sort changes

**Load Order:**
1. Page shell renders
2. Shows spinner while `isLoading` is true
3. Quiz grid appears after fetch

**Loading UX:**
- ✅ Spinner component (8x8 border spinner)
- ✅ "Loading quizzes..." text
- ⚠️ No skeleton for quiz grid
- ⚠️ Full-page loading blocks UI

**Techniques:**
- Client-side only
- Re-fetches on filter changes
- Basic spinner loading state

---

### 12. Dashboard Page (`/dashboard`)

**File:** `apps/admin/src/app/dashboard/page.tsx`

**Data Fetching:**
- Client component (`"use client"`)
- Hardcoded mock data (no API calls)
- Lazy-loaded charts via `charts-lazy.tsx`

**Load Order:**
1. Page shell renders immediately
2. KPI cards show with mock data
3. Charts lazy-load below the fold

**Loading UX:**
- ✅ Lazy-loaded charts (`charts-lazy.tsx`)
- ⚠️ No loading states for charts
- ⚠️ Mock data - no real fetching

**Techniques:**
- Dynamic imports for charts
- Client-side only
- No data fetching (mock data)

---

### 13. About Page (`/about`)

**File:** `apps/admin/src/app/about/page.tsx`

**Data Fetching:**
- Client component (`"use client"`)
- Static content - no data fetching

**Load Order:**
1. Content renders immediately
2. Framer Motion animations on scroll

**Loading UX:**
- ✅ No loading needed (static content)
- ✅ Smooth animations

**Techniques:**
- Static content
- Scroll-triggered animations

---

### 14. Sign In / Sign Up Pages

**Files:** `sign-in/page.tsx`, `sign-up/page.tsx`

**Data Fetching:**
- Client components
- Form submission only - no initial data fetching

**Loading UX:**
- ✅ No loading needed (forms)
- Forms handle their own submission states

**Techniques:**
- Static forms
- Client-side validation

---

## Summary of Current Patterns

### ✅ Good Patterns Found

1. **Server Components with Suspense** (`/stats`)
   - Uses Suspense boundary
   - Custom skeleton fallback
   - Server-side data fetching

2. **React Query with Caching** (`/leagues`)
   - Instant initial render from cache
   - Background refetch
   - Skeleton components

3. **Batch API Calls** (`/quizzes`)
   - Batch completions API call
   - Parallel fetching with `Promise.all` (`/custom-quizzes`)

4. **Dynamic Imports** (`/leagues`, `/dashboard`)
   - Lazy-loads heavy components
   - Skeleton fallbacks

5. **Skeleton Components**
   - `Skeleton`, `SkeletonCard`, `SkeletonText` exist
   - `LeaguesListSkeleton`, `LeagueDetailsSkeleton`
   - `QuizLoadingSkeleton` (not used in play page)
   - `StatsSkeleton` (good example)

### ⚠️ Issues Found

1. **Mostly Client Components**
   - Only 2 pages use Server Components (`/stats`, `/quizzes/[slug]/play`)
   - 90%+ of pages are client components
   - Missing server-side data fetching benefits

2. **No Route-Level Loading Files**
   - Only `apps/admin/src/app/admin/loading.tsx` exists
   - No `loading.tsx` for customer-facing routes
   - Missing Next.js App Router loading states

3. **Artificial Delays**
   - Landing page: 100ms delay
   - Quizzes page: 300ms delay
   - Should remove and use real loading states

4. **Inconsistent Loading UX**
   - Some pages: skeletons
   - Some pages: spinners
   - Some pages: text only
   - Some pages: no loading state

5. **Blocking Loads**
   - Most pages block entire UI while loading
   - No progressive/streaming loading
   - Heavy sections not deferred

6. **Missing Skeletons**
   - Achievements page: no skeleton
   - Leaderboards page: no skeleton
   - Custom quizzes: no skeleton
   - Explore quizzes: no skeleton

7. **No Parallel Fetching**
   - Most pages fetch sequentially
   - Only `/custom-quizzes` uses `Promise.all`
   - Could parallelize more

8. **Quiz Play Page Issues**
   - Server Component but no `loading.tsx`
   - No Suspense boundary
   - Blocks until quiz data loads
   - Has `QuizLoadingSkeleton` but doesn't use it

---

## Loading Component Inventory

### Existing Components

1. **`apps/admin/src/components/ui/Skeleton.tsx`**
   - `Skeleton` - basic skeleton div
   - `SkeletonText` - multi-line text skeleton
   - `SkeletonCard` - quiz card skeleton

2. **`apps/admin/src/components/quiz/QuizLoadingSkeleton.tsx`**
   - Full quiz loading skeleton
   - Not used in play page

3. **`apps/admin/src/components/leagues/LeaguesSkeleton.tsx`**
   - `LeaguesListSkeleton`
   - `LeagueDetailsSkeleton`

4. **`apps/admin/src/app/stats/page.tsx`** (inline)
   - `StatsSkeleton` - custom skeleton for stats page

5. **`apps/admin/src/app/admin/loading.tsx`**
   - Admin route loading skeleton
   - Uses `Skeleton` and `StatCardSkeleton`

### Missing Components

- Table row skeleton
- List item skeleton
- Chart skeleton
- Form skeleton
- Loading bar component (for long operations)

---

## Next Steps (Phase 1)

1. Review each page's load order and identify blocking issues
2. Assess which pages can be converted to Server Components
3. Identify opportunities for parallel fetching
4. Design consistent skeleton patterns
5. Plan Suspense boundaries for streaming

