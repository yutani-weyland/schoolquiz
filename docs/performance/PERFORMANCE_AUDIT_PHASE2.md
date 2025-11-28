# Performance Audit - Phase 2: Implementation Plan
**Generated:** 2025-01-27  
**Based on:** Phase 0 Discovery + Phase 1 Review

---

## Overview

This document provides a concrete, actionable implementation plan to improve loading UX across all customer-facing pages. Each change is scoped, prioritized, and includes code examples.

---

## Part 1: Shared Primitives / Design System Updates

### 1.1 Enhance Existing Skeleton Components

**File:** `apps/admin/src/components/ui/Skeleton.tsx`

**Current State:**
- Has `Skeleton`, `SkeletonText`, `SkeletonCard`
- Missing variants for specific use cases

**Changes Needed:**

```tsx
// Add to existing file

/**
 * Achievement Card Skeleton - matches AchievementCard layout
 */
export function AchievementCardSkeleton() {
  return (
    <div 
      className="rounded-2xl p-4 shadow-lg flex flex-col"
      style={{
        width: 'clamp(120px, 25vw, 200px)',
        maxWidth: '200px',
        aspectRatio: '5/8', // Match achievement card ratio
      }}
    >
      <Skeleton className="h-6 w-16 rounded-full mb-3" />
      <Skeleton className="h-8 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-auto" />
      <Skeleton className="h-3 w-20 mt-auto" />
    </div>
  )
}

/**
 * Leaderboard Card Skeleton - matches LeaderboardCard layout
 */
export function LeaderboardCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  )
}

/**
 * Quiz Card Grid Skeleton - for quiz list pages
 */
export function QuizCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/**
 * Page Header Skeleton - for page titles and descriptions
 */
export function PageHeaderSkeleton() {
  return (
    <div className="text-center mb-8 space-y-4">
      <Skeleton className="h-12 w-full max-w-md mx-auto" />
      <Skeleton className="h-6 w-full max-w-lg mx-auto" />
    </div>
  )
}
```

**Export Updates:**
```tsx
export { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard,
  AchievementCardSkeleton,
  LeaderboardCardSkeleton,
  QuizCardGridSkeleton,
  PageHeaderSkeleton,
}
```

---

### 1.2 Create LoadingBar Component

**File:** `apps/admin/src/components/ui/LoadingBar.tsx` (NEW)

**Purpose:** For long-running operations (PDF generation, exports, large data loads)

```tsx
'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LoadingBarProps {
  isLoading: boolean
  progress?: number // 0-100
  className?: string
  showPercentage?: boolean
}

export function LoadingBar({ 
  isLoading, 
  progress, 
  className,
  showPercentage = false 
}: LoadingBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    if (isLoading && progress !== undefined) {
      setDisplayProgress(progress)
    } else if (isLoading) {
      // Simulate progress if not provided
      const interval = setInterval(() => {
        setDisplayProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 200)
      return () => clearInterval(interval)
    } else {
      setDisplayProgress(100)
      setTimeout(() => setDisplayProgress(0), 300)
    }
  }, [isLoading, progress])

  if (!isLoading && displayProgress === 0) return null

  return (
    <div 
      className={cn("w-full", className)}
      role="progressbar"
      aria-valuenow={displayProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading progress"
    >
      <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-out"
          style={{ width: `${displayProgress}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-right">
          {Math.round(displayProgress)}%
        </p>
      )}
    </div>
  )
}
```

---

### 1.3 Enhance Spinner Component

**File:** `apps/admin/src/components/ui/spinner.tsx`

**Current State:** Basic spinner with size-4 only

**Enhancement:**

```tsx
import { LoaderIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends React.ComponentProps<"svg"> {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
}

function Spinner({ 
  size = 'md',
  className, 
  ...props 
}: SpinnerProps) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("animate-spin", sizeClasses[size], className)}
      {...props}
    />
  )
}

export { Spinner }
```

---

### 1.4 Create Route Loading Wrapper

**File:** `apps/admin/src/components/ui/RouteLoading.tsx` (NEW)

**Purpose:** Consistent wrapper for route-level loading states

```tsx
import { SiteHeader } from '@/components/SiteHeader'
import { Footer } from '@/components/Footer'
import { ReactNode } from 'react'

interface RouteLoadingProps {
  children: ReactNode
  showHeader?: boolean
  showFooter?: boolean
}

export function RouteLoading({ 
  children, 
  showHeader = true,
  showFooter = false 
}: RouteLoadingProps) {
  return (
    <>
      {showHeader && <SiteHeader />}
      <main className="min-h-screen pt-24 pb-16">
        {children}
      </main>
      {showFooter && <Footer />}
    </>
  )
}
```

---

## Part 2: Per-Page Modifications

### 2.1 Landing Page (`/`)

**Files to Modify:**
- `apps/admin/src/app/page.tsx`
- `apps/admin/src/app/loading.tsx` (NEW)

**Changes:**

#### Step 1: Create `loading.tsx`

```tsx
// apps/admin/src/app/loading.tsx
import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton, SkeletonText, PageHeaderSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <RouteLoading>
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <PageHeaderSkeleton />
        <div className="max-w-4xl mx-auto space-y-8">
          <SkeletonText lines={3} />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-12 w-48 rounded-full" />
            <Skeleton className="h-12 w-48 rounded-full" />
          </div>
        </div>
      </div>
    </RouteLoading>
  )
}
```

#### Step 2: Remove Artificial Delay

**In `apps/admin/src/app/page.tsx`:**

```tsx
// REMOVE this:
const [contentLoaded, setContentLoaded] = useState(false);
useEffect(() => {
  setMounted(true);
  const timer = setTimeout(() => setContentLoaded(true), 100); // ❌ REMOVE
  return () => clearTimeout(timer);
}, []);

// REPLACE with:
const [mounted, setMounted] = useState(false);
useEffect(() => {
  setMounted(true);
}, []);

// REMOVE all contentLoaded conditionals - render immediately
```

#### Step 3: Convert to Server Component (Optional - Phase 3)

For now, keep as client component but remove delays. Server Component conversion can happen later.

---

### 2.2 Quizzes Page (`/quizzes`)

**Files to Modify:**
- `apps/admin/src/app/quizzes/page.tsx`
- `apps/admin/src/app/quizzes/loading.tsx` (NEW)

**Changes:**

#### Step 1: Create `loading.tsx`

```tsx
// apps/admin/src/app/quizzes/loading.tsx
import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton, QuizCardGridSkeleton } from '@/components/ui/Skeleton'

export default function QuizzesLoading() {
  return (
    <RouteLoading>
      <div className="max-w-[1600px] mx-auto px-6 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-8 min-h-[1.2em] flex items-center justify-center">
          <Skeleton className="h-20 w-full max-w-md" />
        </div>
        <QuizCardGridSkeleton count={6} />
      </div>
    </RouteLoading>
  )
}
```

#### Step 2: Remove Artificial Delay

**In `apps/admin/src/app/quizzes/page.tsx`:**

```tsx
// REMOVE:
const [isLoading, setIsLoading] = useState(true);
useEffect(() => {
  // ... auth check ...
  const loadingTimer = setTimeout(() => {
    setIsLoading(false);
    // ...
  }, 300); // ❌ REMOVE
  return () => clearTimeout(loadingTimer);
}, []);

// REPLACE with:
// Use Next.js loading state instead - remove isLoading state
// Show skeleton only when actually loading data
```

#### Step 3: Convert to Server Component (Phase 3)

Plan for Server Component conversion:
- Fetch quiz list server-side
- Pass initial data to client component
- Use Suspense for streaming

---

### 2.3 Quiz Play Page (`/quizzes/[slug]/play`)

**Files to Modify:**
- `apps/admin/src/app/quizzes/[slug]/play/loading.tsx` (NEW)

**Changes:**

#### Step 1: Create `loading.tsx`

```tsx
// apps/admin/src/app/quizzes/[slug]/play/loading.tsx
import { QuizLoadingSkeleton } from '@/components/quiz/QuizLoadingSkeleton'

export default function QuizPlayLoading() {
  return <QuizLoadingSkeleton />
}
```

**Note:** `QuizLoadingSkeleton` already exists! Just need to use it.

#### Step 2: Add Suspense Boundary (Optional Enhancement)

**In `apps/admin/src/app/quizzes/[slug]/play/page.tsx`:**

```tsx
import { Suspense } from 'react'
import { QuizLoadingSkeleton } from '@/components/quiz/QuizLoadingSkeleton'

export default async function QuizPlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  return (
    <ErrorBoundary>
      <Suspense fallback={<QuizLoadingSkeleton />}>
        <QuizPlayContent slug={slug} />
      </Suspense>
    </ErrorBoundary>
  )
}

async function QuizPlayContent({ slug }: { slug: string }) {
  const { quizData, metadata } = await getQuizData(slug) || {}
  // ... rest of logic
}
```

---

### 2.4 Account Page (`/account`)

**Files to Modify:**
- `apps/admin/src/app/account/page.tsx`
- `apps/admin/src/app/account/loading.tsx` (NEW)

**Changes:**

#### Step 1: Create `loading.tsx`

```tsx
// apps/admin/src/app/account/loading.tsx
import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton } from '@/components/ui/Skeleton'
import { FormSkeleton } from '@/components/admin/ui/skeletons'

export default function AccountLoading() {
  return (
    <RouteLoading showFooter={false}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          
          {/* Tab switcher skeleton */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-full">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 flex-1 rounded-full" />
            ))}
          </div>
          
          {/* Tab content skeleton */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border">
            <FormSkeleton />
          </div>
        </div>
      </div>
    </RouteLoading>
  )
}
```

#### Step 2: Replace Spinner with Skeleton

**In `apps/admin/src/app/account/page.tsx`:**

```tsx
// REMOVE:
if (tierLoading) {
  return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </PageLayout>
  )
}

// REPLACE with:
// Remove this check - let loading.tsx handle it
// Or use Suspense if converting to Server Component
```

---

### 2.5 Achievements Page (`/achievements`)

**Files to Modify:**
- `apps/admin/src/app/achievements/page.tsx`
- `apps/admin/src/app/achievements/loading.tsx` (NEW)

**Changes:**

#### Step 1: Create `loading.tsx`

```tsx
// apps/admin/src/app/achievements/loading.tsx
import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton, AchievementCardSkeleton, PageHeaderSkeleton } from '@/components/ui/Skeleton'

export default function AchievementsLoading() {
  return (
    <RouteLoading>
      <div className="min-h-screen flex flex-col items-center px-6 pt-24 pb-16">
        <PageHeaderSkeleton />
        
        {/* Filters skeleton */}
        <div className="max-w-4xl mx-auto mb-8 w-full">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <Skeleton className="h-10 w-full max-w-md rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>
        
        {/* Achievement cards skeleton */}
        <div className="max-w-7xl mx-auto w-full px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <AchievementCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </RouteLoading>
  )
}
```

#### Step 2: Add Loading State to Page

**In `apps/admin/src/app/achievements/page.tsx`:**

```tsx
// ADD at top of component:
if (isLoading) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">
        {/* Show skeleton grid while loading */}
        <div className="flex flex-wrap justify-center gap-4 p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <AchievementCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </>
  )
}
```

---

### 2.6 Leaderboards Page (`/leaderboards`)

**Files to Modify:**
- `apps/admin/src/app/leaderboards/page.tsx`
- `apps/admin/src/app/leaderboards/loading.tsx` (NEW)

**Changes:**

#### Step 1: Create `loading.tsx`

```tsx
// apps/admin/src/app/leaderboards/loading.tsx
import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton, LeaderboardCardSkeleton } from '@/components/ui/Skeleton'

export default function LeaderboardsLoading() {
  return (
    <RouteLoading showFooter={false}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        {/* Filters skeleton */}
        <div className="mb-6 flex gap-4">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        
        {/* Leaderboard cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LeaderboardCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </RouteLoading>
  )
}
```

#### Step 2: Replace Text Loading with Skeleton

**In `apps/admin/src/app/leaderboards/page.tsx`:**

```tsx
// REMOVE:
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-500">Loading leaderboards...</div>
    </div>
  )
}

// REPLACE with:
// Remove - Next.js loading.tsx will handle it
// Or show skeleton grid inline if needed
```

---

### 2.7 Stats Page (`/stats`)

**Files to Modify:**
- `apps/admin/src/app/stats/page.tsx` (already good, minor enhancement)

**Changes:**

#### Enhancement: Add Route-Level Loading

```tsx
// apps/admin/src/app/stats/loading.tsx
import { RouteLoading } from '@/components/ui/RouteLoading'
import { StatsSkeleton } from './page' // Reuse existing

export default function StatsLoading() {
  return <StatsSkeleton />
}
```

**Note:** This page is already well-optimized! Just add route-level loading for consistency.

---

### 2.8 Leagues Page (`/leagues`)

**Files to Modify:**
- `apps/admin/src/app/leagues/loading.tsx` (NEW)

**Changes:**

#### Step 1: Create `loading.tsx`

```tsx
// apps/admin/src/app/leagues/loading.tsx
import { RouteLoading } from '@/components/ui/RouteLoading'
import { LeaguesListSkeleton, LeagueDetailsSkeleton } from '@/components/leagues/LeaguesSkeleton'

export default function LeaguesLoading() {
  return (
    <RouteLoading>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <LeaguesListSkeleton />
          </div>
          <div className="lg:col-span-2">
            <LeagueDetailsSkeleton />
          </div>
        </div>
      </div>
    </RouteLoading>
  )
}
```

**Note:** This page already has good skeletons! Just add route-level loading.

---

### 2.9 Custom Quizzes Page (`/custom-quizzes`)

**Files to Modify:**
- `apps/admin/src/app/custom-quizzes/page.tsx`
- `apps/admin/src/app/custom-quizzes/loading.tsx` (NEW)

**Changes:**

#### Step 1: Create `loading.tsx`

```tsx
// apps/admin/src/app/custom-quizzes/loading.tsx
import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton, QuizCardGridSkeleton } from '@/components/ui/Skeleton'

export default function CustomQuizzesLoading() {
  return (
    <RouteLoading showFooter={false}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <QuizCardGridSkeleton count={6} />
      </div>
    </RouteLoading>
  )
}
```

#### Step 2: Add Loading State

**In `apps/admin/src/app/custom-quizzes/page.tsx`:**

```tsx
// ADD loading state check:
if (loading) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
```

---

### 2.10 Explore Quizzes Page (`/explore-quizzes`)

**Files to Modify:**
- `apps/admin/src/app/explore-quizzes/page.tsx`
- `apps/admin/src/app/explore-quizzes/loading.tsx` (NEW)

**Changes:**

#### Step 1: Create `loading.tsx`

```tsx
// apps/admin/src/app/explore-quizzes/loading.tsx
import { RouteLoading } from '@/components/ui/RouteLoading'
import { Skeleton } from '@/components/ui/Skeleton'
import { TableSkeleton } from '@/components/admin/ui/skeletons'

export default function ExploreQuizzesLoading() {
  return (
    <RouteLoading showFooter={false}>
      <div className="max-w-full mx-auto px-6 pt-20">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        {/* Search and filters skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <Skeleton className="h-10 lg:col-span-2 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
        
        {/* Quiz grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-8 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </RouteLoading>
  )
}
```

#### Step 2: Replace Spinner with Skeleton

**In `apps/admin/src/app/explore-quizzes/page.tsx`:**

```tsx
// REMOVE:
{isLoading ? (
  <div className="text-center py-12">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    <p className="mt-4 text-sm text-gray-600">Loading quizzes...</p>
  </div>
) : (
  // ...
)}

// REPLACE with:
// Remove - Next.js loading.tsx will handle it
// Or show skeleton grid inline
```

---

## Part 3: Migration Order & Strategy

### Phase 2A: Quick Wins (Week 1)

**Goal:** Remove artificial delays and add route-level loading files

**Tasks:**
1. ✅ Create shared primitives (Skeleton variants, LoadingBar, RouteLoading)
2. ✅ Create `loading.tsx` files for all routes (9 files)
3. ✅ Remove artificial delays (Landing, Quizzes pages)
4. ✅ Replace spinners with skeletons (Account, Leaderboards, Explore)

**Impact:** Immediate UX improvement, no architectural changes

**Files to Create:**
- `apps/admin/src/components/ui/LoadingBar.tsx`
- `apps/admin/src/components/ui/RouteLoading.tsx`
- `apps/admin/src/app/loading.tsx`
- `apps/admin/src/app/quizzes/loading.tsx`
- `apps/admin/src/app/quizzes/[slug]/play/loading.tsx`
- `apps/admin/src/app/account/loading.tsx`
- `apps/admin/src/app/achievements/loading.tsx`
- `apps/admin/src/app/leaderboards/loading.tsx`
- `apps/admin/src/app/stats/loading.tsx`
- `apps/admin/src/app/leagues/loading.tsx`
- `apps/admin/src/app/custom-quizzes/loading.tsx`
- `apps/admin/src/app/explore-quizzes/loading.tsx`

**Files to Modify:**
- `apps/admin/src/components/ui/Skeleton.tsx` (add variants)
- `apps/admin/src/components/ui/spinner.tsx` (enhance)
- `apps/admin/src/app/page.tsx` (remove delay)
- `apps/admin/src/app/quizzes/page.tsx` (remove delay)
- `apps/admin/src/app/account/page.tsx` (replace spinner)
- `apps/admin/src/app/achievements/page.tsx` (add loading state)
- `apps/admin/src/app/leaderboards/page.tsx` (replace text)
- `apps/admin/src/app/custom-quizzes/page.tsx` (add loading state)
- `apps/admin/src/app/explore-quizzes/page.tsx` (replace spinner)

---

### Phase 2B: Server Component Conversion (Week 2-3)

**Goal:** Convert high-traffic pages to Server Components

**Priority Order:**

1. **`/quizzes`** - High traffic, public-facing
   - Fetch quiz list server-side
   - Pass to client component for interactivity
   - Use Suspense for streaming

2. **`/achievements`** - User-specific data
   - Fetch achievements server-side
   - Stream achievement cards

3. **`/leaderboards`** - User-specific data
   - Fetch leaderboards server-side
   - Stream leaderboard sections

4. **`/custom-quizzes`** - Premium feature
   - Fetch quizzes server-side
   - Keep client component for create/edit

5. **`/explore-quizzes`** - Could be static with ISR
   - Convert to Server Component
   - Use ISR for caching
   - Server-side filtering

**Strategy:**
- Start with one page as proof of concept
- Test performance improvements
- Document patterns for other pages
- Roll out incrementally

---

### Phase 2C: Streaming & Suspense (Week 4)

**Goal:** Add Suspense boundaries for progressive loading

**Tasks:**
1. Add Suspense to Quiz Play page
2. Stream heavy sections (charts, lists)
3. Add granular Suspense boundaries

**Pages to Enhance:**
- `/quizzes/[slug]/play` - Stream quiz rounds
- `/stats` - Stream individual charts
- `/dashboard` - Stream chart sections
- `/achievements` - Stream achievement batches

---

## Part 4: Guardrails & Testing

### 4.1 Guardrails

**Do NOT:**
- ❌ Change business logic or data shape
- ❌ Break existing API contracts
- ❌ Remove Achievement Creator feature
- ❌ Change authentication patterns
- ❌ Modify database schemas

**DO:**
- ✅ Only change loading UX and data fetching patterns
- ✅ Preserve all existing functionality
- ✅ Use existing components where possible
- ✅ Add `// TODO:` comments for ambiguous cases
- ✅ Test on slow networks (Chrome DevTools throttling)

---

### 4.2 Testing Strategy

**Manual Testing Checklist:**

For each modified page:
- [ ] Page shows skeleton immediately on navigation
- [ ] Skeleton matches final layout
- [ ] No layout shift (CLS) when content loads
- [ ] Works on slow 3G network
- [ ] Works on mobile devices
- [ ] Dark mode works correctly
- [ ] No console errors
- [ ] Accessibility: Screen reader announces loading state

**Performance Testing:**
- [ ] Measure TTFB (Time to First Byte)
- [ ] Measure FCP (First Contentful Paint)
- [ ] Measure LCP (Largest Contentful Paint)
- [ ] Check bundle size (should not increase significantly)

**Browser Testing:**
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari
- [ ] Mobile Chrome

---

### 4.3 Rollback Plan

**If Issues Arise:**
1. Revert `loading.tsx` files (they're additive, won't break existing)
2. Keep artificial delays as fallback (temporary)
3. Gradual rollout: Test on staging first
4. Feature flag for new loading patterns (optional)

---

## Part 5: Code Examples

### Example 1: Server Component with Suspense

```tsx
// apps/admin/src/app/quizzes/page.tsx (Future - Phase 2B)
import { Suspense } from 'react'
import { QuizCardGridSkeleton } from '@/components/ui/Skeleton'
import { QuizzesList } from './QuizzesList'

export default async function QuizzesPage() {
  // Fetch initial data server-side
  const quizzes = await getQuizzes()
  
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen pt-24">
        <div className="max-w-[1600px] mx-auto px-6">
          <Suspense fallback={<QuizCardGridSkeleton />}>
            <QuizzesList initialQuizzes={quizzes} />
          </Suspense>
        </div>
      </main>
    </>
  )
}
```

### Example 2: Client Component with Loading State

```tsx
// apps/admin/src/app/achievements/page.tsx (Current - Phase 2A)
'use client'

import { AchievementCardSkeleton } from '@/components/ui/Skeleton'

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // ... fetch logic ...
  
  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen">
          <div className="flex flex-wrap justify-center gap-4 p-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <AchievementCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </>
    )
  }
  
  // ... rest of component
}
```

### Example 3: Using LoadingBar

```tsx
// For PDF generation or long operations
import { LoadingBar } from '@/components/ui/LoadingBar'

function PDFGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const generatePDF = async () => {
    setIsGenerating(true)
    // ... PDF generation with progress updates
    setProgress(50) // Update progress
    // ...
    setProgress(100)
    setIsGenerating(false)
  }
  
  return (
    <div>
      <LoadingBar isLoading={isGenerating} progress={progress} showPercentage />
      <button onClick={generatePDF}>Generate PDF</button>
    </div>
  )
}
```

---

## Summary

### Files to Create (12 new files)
1. `apps/admin/src/components/ui/LoadingBar.tsx`
2. `apps/admin/src/components/ui/RouteLoading.tsx`
3. `apps/admin/src/app/loading.tsx`
4. `apps/admin/src/app/quizzes/loading.tsx`
5. `apps/admin/src/app/quizzes/[slug]/play/loading.tsx`
6. `apps/admin/src/app/account/loading.tsx`
7. `apps/admin/src/app/achievements/loading.tsx`
8. `apps/admin/src/app/leaderboards/loading.tsx`
9. `apps/admin/src/app/stats/loading.tsx`
10. `apps/admin/src/app/leagues/loading.tsx`
11. `apps/admin/src/app/custom-quizzes/loading.tsx`
12. `apps/admin/src/app/explore-quizzes/loading.tsx`

### Files to Modify (9 files)
1. `apps/admin/src/components/ui/Skeleton.tsx` (add variants)
2. `apps/admin/src/components/ui/spinner.tsx` (enhance)
3. `apps/admin/src/app/page.tsx` (remove delay)
4. `apps/admin/src/app/quizzes/page.tsx` (remove delay)
5. `apps/admin/src/app/account/page.tsx` (replace spinner)
6. `apps/admin/src/app/achievements/page.tsx` (add loading state)
7. `apps/admin/src/app/leaderboards/page.tsx` (replace text)
8. `apps/admin/src/app/custom-quizzes/page.tsx` (add loading state)
9. `apps/admin/src/app/explore-quizzes/page.tsx` (replace spinner)

### Estimated Impact
- **Immediate:** Better perceived performance (skeletons instead of blank screens)
- **Short-term:** Faster initial loads (remove artificial delays)
- **Long-term:** 30-50% faster loads (Server Component conversion)

---

## Next Steps

Ready to proceed with Phase 3 (Code Changes)? The implementation plan is complete and ready to execute.

