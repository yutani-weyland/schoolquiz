# Private Leaderboards - Performance Analysis

## Current Implementation Overview

### Routes & Pages
- **`/leaderboards`** - Main leaderboards list page
- **`/api/my-leaderboards`** - API route for fetching leaderboards
- **`/api/private-leagues/[id]/stats`** - Stats API for individual leagues

### Current Architecture

#### Server Component (`leaderboards-server.ts`)
- ✅ Uses `Promise.all` for parallel fetching
- ❌ Uses `include` instead of `select` (over-fetching)
- ❌ Fetches ALL members for ad-hoc leaderboards
- ❌ No pagination
- ❌ No caching
- ❌ Fetches full organisation/group data when only names needed

#### Client Component (`LeaderboardsClient.tsx`)
- ❌ Loads Framer Motion upfront (~50KB+)
- ❌ Makes duplicate API call on refresh (`/api/my-leaderboards`)
- ❌ No lazy loading
- ❌ Skeleton doesn't match actual card layout
- ❌ No server-rendered shell

#### API Routes
- ❌ `/api/my-leaderboards` duplicates server function logic
- ❌ Uses `include` instead of `select`
- ❌ Fetches full user objects for ad-hoc leaderboards

## Performance Smells Identified

### 1. Over-fetching (Critical)
- **Location**: `leaderboards-server.ts:73-81`
- **Issue**: Uses `include` to fetch full `organisation` and `groupMembers` objects
- **Impact**: Transfers unnecessary data (all organisation fields, all group fields)
- **Fix**: Use `select` with only `id` and `name` fields

### 2. Over-fetching Members (Critical)
- **Location**: `leaderboards-server.ts:175-185` (ad-hoc leaderboards)
- **Issue**: Fetches ALL members with full user objects
- **Impact**: For large leaderboards, transfers hundreds of user records
- **Fix**: Use `_count` aggregate for member count, only fetch user data when needed

### 3. No Pagination (High)
- **Location**: All leaderboard queries
- **Issue**: Fetches all leaderboards at once
- **Impact**: Slow initial load for users with many leaderboards
- **Fix**: Implement pagination or "Load More" with initial limit

### 4. No Caching (High)
- **Location**: `leaderboards-server.ts`
- **Issue**: No `unstable_cache` or revalidation
- **Impact**: Every page load triggers full database queries
- **Fix**: Add caching with appropriate revalidation times

### 5. Client-side Data Fetching (Medium)
- **Location**: `LeaderboardsClient.tsx:66-84`
- **Issue**: Makes duplicate API call on refresh
- **Impact**: Extra round-trip, duplicate logic
- **Fix**: Use server actions or router.refresh()

### 6. Framer Motion Loaded Upfront (Medium)
- **Location**: `LeaderboardsClient.tsx:4`
- **Issue**: Imports Framer Motion at top level
- **Impact**: Adds ~50KB+ to initial bundle
- **Fix**: Lazy-load with `next/dynamic`

### 7. Skeleton Mismatch (Low)
- **Location**: `page.tsx:30-40`
- **Issue**: Skeleton doesn't match actual card layout
- **Impact**: Layout shift when data loads
- **Fix**: Create accurate skeleton component

### 8. No Server-rendered Shell (Medium)
- **Location**: `LeaderboardsClient.tsx`
- **Issue**: Entire page is client component
- **Impact**: Larger client JS bundle, slower initial paint
- **Fix**: Extract static shell to server component

## Data Transfer Analysis

### Current Payload Size (Estimated)
- **Organisation-wide leaderboards**: ~2-5KB per leaderboard (with members)
- **Group leaderboards**: ~2-5KB per leaderboard (with members)
- **Ad-hoc leaderboards**: ~10-50KB per leaderboard (ALL members with user data)

### Optimized Payload Size (Estimated)
- **Organisation-wide leaderboards**: ~500 bytes per leaderboard (summary only)
- **Group leaderboards**: ~500 bytes per leaderboard (summary only)
- **Ad-hoc leaderboards**: ~500 bytes per leaderboard (summary only)

**Potential reduction: 80-90%** for ad-hoc leaderboards

## Query Optimization Opportunities

### Current Queries
1. Fetch organisation memberships (with full includes)
2. Fetch org-wide leaderboards (with full includes)
3. Fetch group leaderboards (with full includes)
4. Fetch ad-hoc leaderboards (with ALL members)

### Optimized Queries
1. Fetch organisation IDs and group IDs only (minimal select)
2. Fetch leaderboard summaries (id, name, description, visibility, memberCount)
3. Fetch user membership status separately (if needed)
4. Use `_count` aggregates instead of fetching members

## Recommended Optimization Plan

### Phase 1: Critical Fixes (Immediate Impact)
1. ✅ Replace `include` with `select` for minimal data fetching
2. ✅ Use `_count` aggregates for member counts
3. ✅ Remove full member fetching for list view
4. ✅ Add `unstable_cache` with appropriate revalidation

### Phase 2: Performance Enhancements
5. ✅ Create server-rendered shell component
6. ✅ Lazy-load Framer Motion
7. ✅ Create accurate skeleton component
8. ✅ Implement pagination or "Load More"

### Phase 3: Advanced Optimizations
9. ✅ Use server actions instead of API routes for mutations
10. ✅ Implement infinite scroll for leaderboards list
11. ✅ Add database indexes for leaderboard queries
12. ✅ Optimize stats API (already partially optimized)

## Expected Performance Improvements

- **Initial Load Time**: 60-80% faster (caching + summary queries)
- **Data Transfer**: 80-90% reduction (summary queries only)
- **Client JS Bundle**: 30-40% smaller (lazy-loaded animations)
- **Perceived Performance**: Instant skeleton → smooth data load

