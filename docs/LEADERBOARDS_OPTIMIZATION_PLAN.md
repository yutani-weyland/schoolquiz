# Private Leaderboards - Comprehensive Optimization Plan

## Overview
Apply the same rigorous performance optimization approach used for quizzes and custom quizzes to the private leaderboards feature.

## Current State Analysis

### Routes
- **`/leaderboards`** - Main list page (server component with client wrapper)
- **`/api/my-leaderboards`** - API route (duplicates server logic)
- **`/api/private-leagues/[id]/stats`** - Stats API (already partially optimized)

### Performance Issues Summary

1. **Over-fetching**: Uses `include` instead of `select`, fetches full objects
2. **No Summary Queries**: Fetches ALL members for ad-hoc leaderboards
3. **No Caching**: Every request hits database
4. **No Pagination**: Loads all leaderboards at once
5. **Client Bundle Size**: Framer Motion loaded upfront
6. **No Server Shell**: Entire page is client component
7. **Skeleton Mismatch**: Loading skeleton doesn't match final layout

## Optimization Strategy

### Phase 1: Summary Queries & Data Optimization

#### 1.1 Create Summary Query Functions
**File**: `apps/admin/src/app/leaderboards/leaderboards-summary-server.ts`

```typescript
export interface LeaderboardSummary {
  id: string
  name: string
  description: string | null
  visibility: 'ORG_WIDE' | 'GROUP' | 'AD_HOC'
  memberCount: number // Aggregate count, not full members array
  isMember: boolean // User's membership status
  isMuted: boolean // User's mute status
  organisation?: {
    id: string
    name: string
  }
  organisationGroup?: {
    id: string
    name: string
    type: string
  }
  creator?: {
    id: string
    name: string
    email: string
  }
}
```

**Key Optimizations**:
- Use `select` instead of `include`
- Use `_count` aggregate for `memberCount`
- Only fetch user's own membership status (not all members)
- Fetch minimal organisation/group data (id, name only)

#### 1.2 Optimize Organisation Context Query
**Current**: Fetches full `organisation` and `groupMembers` with includes
**Optimized**: Fetch only IDs needed for leaderboard queries

```typescript
// Minimal select - only what we need for WHERE clauses
const memberships = await prisma.organisationMember.findMany({
  where: {
    userId: user.id,
    status: 'ACTIVE',
    deletedAt: null,
  },
  select: {
    organisationId: true,
    groupMembers: {
      select: {
        group: {
          select: {
            id: true,
          },
        },
      },
    },
  },
})
```

#### 1.3 Optimize Leaderboard Queries
**Replace**:
```typescript
include: {
  members: {
    where: { userId: user.id, leftAt: null },
    select: { id: true, userId: true, muted: true, leftAt: true },
  },
}
```

**With**:
```typescript
select: {
  id: true,
  name: true,
  description: true,
  visibility: true,
  organisation: { select: { id: true, name: true } },
  organisationGroup: { select: { id: true, name: true, type: true } },
  creator: { select: { id: true, name: true, email: true } },
  _count: {
    select: {
      members: {
        where: { leftAt: null },
      },
    },
  },
}
// Then fetch user's membership separately (single query for all leaderboards)
```

### Phase 2: Caching & Static Shell

#### 2.1 Add Caching
**File**: `apps/admin/src/app/leaderboards/leaderboards-server.ts`

```typescript
import { unstable_cache } from 'next/cache'

const getCachedLeaderboards = unstable_cache(
  async (userId: string, orgIds: string[], groupIds: string[], isPremium: boolean) => {
    // ... summary queries ...
  },
  ['leaderboards-summary'],
  {
    revalidate: 30, // 30 seconds - leaderboards change infrequently
    tags: [`leaderboards-${userId}`],
  }
)
```

#### 2.2 Create Server Shell Component
**File**: `apps/admin/src/app/leaderboards/LeaderboardsShell.tsx`

```typescript
/**
 * OPTIMIZATION: Server-rendered shell for leaderboards page
 * Moves static layout elements to server component to reduce client JS bundle
 */
export function LeaderboardsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1419]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Leaderboards
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Join competitions and track your progress
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
```

### Phase 3: Client Component Optimizations

#### 3.1 Lazy-load Framer Motion
**File**: `apps/admin/src/app/leaderboards/LeaderboardsClient.tsx`

```typescript
// Remove top-level import
// import { motion } from 'framer-motion'

// Lazy-load only when needed
const LazyMotionDiv = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.div })),
  { ssr: false, loading: () => <div /> }
)
```

#### 3.2 Create Accurate Skeleton
**File**: `apps/admin/src/components/ui/LeaderboardCardSkeleton.tsx`

```typescript
export function LeaderboardCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <Skeleton className="h-5 w-3/4 mb-3" />
      <div className="flex gap-2 mb-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  )
}
```

#### 3.3 Use Server Actions Instead of API Routes
**File**: `apps/admin/src/app/leaderboards/leaderboards-actions.ts`

```typescript
'use server'

export async function joinLeaderboard(leaderboardId: string) {
  // ... server action logic ...
}

export async function leaveLeaderboard(leaderboardId: string, mute: boolean = false) {
  // ... server action logic ...
}
```

### Phase 4: Pagination & Infinite Scroll

#### 4.1 Add Pagination Parameters
**File**: `apps/admin/src/app/leaderboards/leaderboards-summary-server.ts`

```typescript
export async function getLeaderboardSummaries(
  userId: string,
  options: {
    limit?: number
    offset?: number
    filter?: 'all' | 'orgWide' | 'group' | 'adHoc'
  } = {}
): Promise<{
  summaries: LeaderboardSummary[]
  total: number
  hasMore: boolean
}> {
  const { limit = 20, offset = 0, filter = 'all' } = options
  // ... paginated queries ...
}
```

#### 4.2 Implement Infinite Scroll
**File**: `apps/admin/src/app/leaderboards/LeaderboardsList.tsx`

```typescript
'use client'

import { useRef, useEffect } from 'react'
import { loadMoreLeaderboards } from './leaderboards-actions'

export function LeaderboardsList({ initialData }: Props) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore) {
          handleLoadMore()
        }
      },
      { rootMargin: '200px' }
    )
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }
    
    return () => observer.disconnect()
  }, [hasMore])
  
  // ... rest of component ...
}
```

### Phase 5: Database Indexes

#### 5.1 Add Composite Indexes
**File**: `supabase/migrations/015_optimize_leaderboard_indexes.sql`

```sql
-- Index for organisation-wide leaderboards
CREATE INDEX IF NOT EXISTS idx_leaderboards_org_visibility_deleted 
ON leaderboards(organisationId, visibility, deletedAt) 
WHERE organisationId IS NOT NULL AND deletedAt IS NULL;

-- Index for group leaderboards
CREATE INDEX IF NOT EXISTS idx_leaderboards_group_visibility_deleted 
ON leaderboards(organisationGroupId, visibility, deletedAt) 
WHERE organisationGroupId IS NOT NULL AND deletedAt IS NULL;

-- Index for ad-hoc leaderboards
CREATE INDEX IF NOT EXISTS idx_leaderboards_visibility_deleted 
ON leaderboards(visibility, deletedAt) 
WHERE visibility = 'AD_HOC' AND deletedAt IS NULL;

-- Index for member count queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_members_leaderboard_left 
ON leaderboard_members(leaderboardId, leftAt) 
WHERE leftAt IS NULL;
```

## Implementation Order

1. **Phase 1.1-1.3**: Create summary queries (immediate 80% data reduction)
2. **Phase 2.1**: Add caching (60-80% faster subsequent loads)
3. **Phase 2.2**: Create server shell (30-40% smaller client bundle)
4. **Phase 3.1**: Lazy-load Framer Motion (50KB+ reduction)
5. **Phase 3.2**: Create accurate skeleton (better perceived performance)
6. **Phase 3.3**: Use server actions (eliminate duplicate API routes)
7. **Phase 4**: Add pagination/infinite scroll (handle large datasets)
8. **Phase 5**: Add database indexes (faster queries)

## Expected Results

- **Initial Load**: 60-80% faster
- **Data Transfer**: 80-90% reduction
- **Client JS Bundle**: 30-40% smaller
- **Perceived Performance**: Instant skeleton → smooth data load
- **Scalability**: Handle 100+ leaderboards without performance degradation

## Success Metrics

- Page loads with skeleton in <100ms
- Data loads in <500ms (cached) or <1.5s (uncached)
- Client JS bundle <150KB (gzipped)
- Smooth infinite scroll with no jank
- No layout shift when data loads

