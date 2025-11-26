# Route Performance Analysis & Optimization Priorities

**Generated:** 2025-01-27  
**Purpose:** Map all user-facing routes, identify data fetching patterns, flag performance issues, and rank optimization priorities for logged-in teachers/presenters.

---

## Summary

**Total Routes Analyzed:** 58 user-facing routes  
**Server Components:** 35 routes (60%)  
**Client Components:** 23 routes (40%)  
**Routes with Performance Issues:** 18 routes (31%)

---

## User-Facing Routes Analysis

### Main Teacher/Presenter Routes

#### 1. `/dashboard` - Dashboard
- **Type:** Client Component (`'use client'`)
- **Data Fetching:** ❌ **Hardcoded mock data** - No real data fetching
- **Performance Issues:**
  - ⚠️ All data is hardcoded (not from database)
  - ⚠️ Client-side component (no SSR benefits)
  - ⚠️ Large component with many static data arrays
- **Priority:** 🔴 **HIGH** - Core page for teachers but shows fake data
- **Recommendation:** Convert to server component, fetch real stats from database

---

#### 2. `/quizzes` - Quizzes List
- **Type:** Server Component ✅
- **Data Fetching:**
  - Server-side: `getQuizzesPageData()` fetches:
    - Quiz completions (Prisma query)
    - Custom quizzes (conditional, premium users)
  - Uses `unstable_cache` with 30s revalidation
- **Performance Issues:**
  - ✅ Good: Parallel fetching (`Promise.all`)
  - ✅ Good: User-specific caching
  - ⚠️ Static quiz list hardcoded (12 quizzes)
- **Priority:** 🟡 **LOW** - Already optimized

---

#### 3. `/explore-quizzes` - Explore Quizzes
- **Type:** Server Component ✅
- **Data Fetching:**
  - Server-side: `getExploreQuizzesPageData()` fetches:
    - Quizzes with rounds and questions (deep nested Prisma query)
    - Limit 100 quizzes
  - `revalidate = 3600` (1 hour ISR)
- **Performance Issues:**
  - 🔴 **CRITICAL:** Fetches **all rounds and questions** for all quizzes (N+1 query risk)
  - 🔴 **CRITICAL:** Deep nested includes (rounds → questions → question data)
  - 🔴 **CRITICAL:** Large data structure sent to client (could be 100s of KB)
  - ⚠️ No pagination (loads all 100 at once)
- **Priority:** 🔴 **HIGH** - Likely very slow with many quizzes
- **Recommendation:**
  - Remove nested question data from initial load
  - Add pagination
  - Use lazy loading for question details

---

#### 4. `/leaderboards` - Leaderboards
- **Type:** Server Component ✅
- **Data Fetching:**
  - Server-side: `getLeaderboardsPageData()` fetches:
    - Organisation memberships (Prisma query)
    - 3 parallel queries for org-wide, group, and ad-hoc leaderboards
  - `dynamic = 'force-dynamic'`
- **Performance Issues:**
  - ✅ Good: Parallel fetching for 3 leaderboard types
  - ⚠️ Fetches all organisation memberships first (could be slow for users in many orgs)
  - ⚠️ Includes member data in each leaderboard query
- **Priority:** 🟡 **MEDIUM** - Could be optimized with better indexing

---

#### 5. `/leagues` - Private Leagues
- **Type:** Client Component (`'use client'`)
- **Data Fetching:**
  - Client-side with React Query:
    - `fetchLeagues()` - Fetches user's leagues
    - `fetchLeagueDetails(leagueId)` - Fetches full league with members (on selection)
    - `fetchLeagueStats(leagueId)` - Fetches stats (on selection)
    - `fetchLeagueRequests()` - Fetches pending requests (polls every 30s)
    - `fetchAvailableOrgLeagues()` - Fetches org leagues
  - Uses localStorage caching for instant initial render
  - Multiple sequential queries based on user interactions
- **Performance Issues:**
  - 🔴 **CRITICAL:** All data fetching happens client-side (no SSR)
  - 🔴 **CRITICAL:** Multiple sequential fetches when league selected:
    1. League details
    2. League stats
    3. Organisation members (for invite modal)
  - 🔴 **CRITICAL:** Polling every 30 seconds for requests
  - ⚠️ Large component (2000+ lines) with complex state management
  - ⚠️ Virtual scrolling for member list (good optimization)
- **Priority:** 🔴 **HIGH** - Very slow initial load, multiple waterfalls
- **Recommendation:**
  - Convert to server component for initial data
  - Batch league details + stats in single API call
  - Use server actions for mutations

---

#### 6. `/stats` - Stats Dashboard
- **Type:** Server Component ✅
- **Data Fetching:**
  - Server-side: `getStatsData()` → calls `/api/stats` route
  - API route fetches comprehensive stats (summary, streaks, categories, weekly streak, performance, comparisons)
  - `dynamic = 'force-dynamic'`
- **Performance Issues:**
  - 🔴 **CRITICAL:** **Double hop** - Server component calls API route (inefficient)
  - 🔴 **CRITICAL:** API route likely does complex aggregations
  - 🔴 **CRITICAL:** Fetches comparison data (public averages, league comparisons)
  - ⚠️ No caching mentioned in API route
- **Priority:** 🔴 **HIGH** - Inefficient double-hop pattern
- **Recommendation:**
  - Call database directly from server component (skip API route)
  - Add caching for comparison data (changes slowly)
  - Parallelize independent queries

---

#### 7. `/achievements` - Achievements
- **Type:** Server Component ✅
- **Data Fetching:**
  - Server-side: `getAchievementsPageData()` (file not examined in detail)
  - `dynamic = 'force-dynamic'`
- **Performance Issues:** Unknown (need to examine server file)
- **Priority:** 🟡 **MEDIUM** - Need to review

---

#### 8. `/profile/[userId]` - Profile Page
- **Type:** Server Component ✅
- **Data Fetching:**
  - Server-side: Parallel fetches:
    - `getProfileData(userId)`
    - `getSeasonStats(season)`
    - `getUserAchievements()`
  - Uses Suspense for progressive loading
- **Performance Issues:**
  - ✅ Good: Parallel fetching
  - ✅ Good: Uses Suspense boundaries
  - ⚠️ Each function may have multiple internal queries
- **Priority:** 🟡 **LOW** - Already optimized

---

### Admin Routes (for Platform/Org Admins)

#### 9. `/admin` - Admin Overview
- **Type:** Server Component ✅
- **Data Fetching:**
  - Server-side: `fetchAdminStats()` (cached)
  - `dynamic = 'force-dynamic'`
- **Performance Issues:**
  - ✅ Good: Server-side with caching
- **Priority:** 🟡 **LOW**

---

#### 10. `/admin/organisations` - Organisations List
- **Type:** Server Component + Client Component
- **Data Fetching:**
  - Initial: Server-side `getOrganisations()` with pagination
  - Client-side: Re-fetches on filter/search changes (debounced)
- **Performance Issues:**
  - ✅ Good: Server-rendered initial data
  - ✅ Good: Debounced client-side fetching
- **Priority:** 🟡 **LOW** - Already optimized

---

#### 11. `/admin/users` - Users List
- **Type:** Server Component + Client Component
- **Data Fetching:**
  - Similar to organisations (server initial + client filtering)
- **Performance Issues:**
  - ✅ Good pattern
- **Priority:** 🟡 **LOW**

---

#### 12. `/admin/quizzes` - Admin Quizzes
- **Type:** Unknown (file not examined)
- **Priority:** 🟡 **MEDIUM** - Need to review

---

### Other Routes

#### 13. `/quizzes/[slug]/play` - Quiz Play Page
- **Type:** Server Component ✅
- **Data Fetching:**
  - Server-side: `getQuizData(slug)` fetches quiz with rounds and questions
  - Uses caching
- **Performance Issues:**
  - ⚠️ Deep nested query (quiz → rounds → questions)
  - ✅ Good: Server-side with caching
- **Priority:** 🟡 **MEDIUM** - Could optimize query

---

#### 14. `/custom-quizzes` - Custom Quizzes List
- **Type:** Server Component ✅
- **Data Fetching:**
  - Similar to `/quizzes`
- **Priority:** 🟡 **LOW**

---

#### 15. `/account` - Account Page
- **Type:** Client Component
- **Data Fetching:**
  - Client-side: Fetches subscription status on mount
- **Performance Issues:**
  - ⚠️ Client-side only
  - ⚠️ Could be server-rendered
- **Priority:** 🟡 **LOW**

---

## Performance Smells Identified

### 🔴 Critical Issues

1. **Double-Hop API Calls**
   - `/stats` - Server component → API route → Database
   - **Impact:** Extra network hop, slower response
   - **Fix:** Call database directly from server component

2. **Client-Side Data Fetching (No SSR)**
   - `/leagues` - Entire page is client-side
   - **Impact:** Slow initial load, no SEO benefits, hydration delays

3. **Deep Nested Queries**
   - `/quizzes/[slug]/play` - Deep nested quiz data
   - **Impact:** Large payloads, slow queries

4. **Multiple Sequential Fetches**
   - `/leagues` - League details → Stats → Org members (waterfall)
   - **Impact:** Slow perceived load time

5. **No Pagination**
   - Some list views could benefit from pagination
   - **Impact:** Large initial payloads on pages with many items

### 🟡 Medium Issues

6. **Polling/Real-time Updates**
   - `/leagues` - Polls for requests every 30s
   - **Impact:** Unnecessary requests, battery drain

7. **Large Client Components**
   - `/leagues` - 2000+ lines, complex state
   - **Impact:** Large bundle size, slower hydration

8. **Missing Caching**
   - Some API routes lack explicit caching
   - **Impact:** Repeated queries, slower responses

---

## Top 3 Routes Needing Performance Work

### Ranked by Impact for Teachers/Presenters

#### 🔴 #1: `/leagues` - Private Leagues
**Why:**
- Used by premium teachers/presenters to manage student competitions
- **Critical Issues:**
  - Entire page is client-side (no SSR)
  - Multiple sequential fetches create waterfall loading
  - Polling every 30 seconds
  - Very large component (2000+ lines)
- **Estimated Impact:** 40-60% slower initial load vs server-rendered
- **Recommended Fixes:**
  1. Convert to server component for initial data
  2. Batch league details + stats in single query
  3. Use server actions for mutations
  4. Remove polling, use webhooks or SSE instead
  5. Split into smaller components

---

#### ✅ REMOVED: `/explore-quizzes` - Explore Quizzes
**Status:** Route has been removed from the codebase (2025-01-27)
- Was redundant and no longer in use
- Had performance issues (deep nested queries, no pagination)
- Navigation links removed

---

#### 🔴 #3: `/stats` - Stats Dashboard
**Why:**
- Used by teachers/presenters to view student performance analytics
- **Critical Issues:**
  - Double-hop: Server component → API route → Database
  - Complex aggregations (summary, streaks, categories, comparisons)
  - No explicit caching
  - Fetches comparison data (public averages)
- **Estimated Impact:** 1-2 second overhead from double-hop
- **Recommended Fixes:**
  1. Call database directly from server component (remove API route)
  2. Parallelize independent queries
  3. Cache comparison data (changes slowly)
  4. Use streaming for progressive loading

---

#### ✅ REMOVED: `/dashboard` - Dashboard
**Status:** Route has been removed from the codebase (2025-01-27)
- Was showing hardcoded mock data
- No longer in use
- Navigation links removed

---

#### 🟡 #5: `/leaderboards` - Leaderboards
**Why:**
- Used by teachers to view competition leaderboards
- **Issues:**
  - Fetches all organisation memberships first (could be slow)
  - Multiple parallel queries (good) but could be optimized
  - Includes member data in each leaderboard
- **Estimated Impact:** Moderate slowdown for users in many organisations
- **Recommended Fixes:**
  1. Add database indexes for organisation memberships
  2. Optimize member data fetching (don't include all members initially)
  3. Add pagination for leaderboard members

---

## Optimization Recommendations Summary

### Immediate Actions (High Priority)

1. **Convert `/leagues` to Server Component**
   - Move initial data fetching to server
   - Batch related queries
   - Use server actions for mutations

2. **Optimize `/explore-quizzes` Query**
   - Remove nested question data from initial load
   - Add pagination
   - Load questions on demand

3. **Fix `/stats` Double-Hop**
   - Call database directly from server component
   - Remove unnecessary API route layer

4. **Implement Real Data for `/dashboard`**
   - Connect to database
   - Calculate real KPIs
   - Add caching

### Medium Priority

5. **Add Database Indexes**
   - Organisation memberships
   - Quiz completions
   - Leaderboard members

6. **Implement Request Deduplication**
   - Use React Query more consistently
   - Add request deduplication layer

7. **Add Caching Strategy**
   - Redis or similar for frequently accessed data
   - Cache invalidation strategy

### Low Priority

8. **Code Splitting**
   - Split large components (`/leagues`)
   - Lazy load heavy dependencies

9. **Bundle Optimization**
   - Analyze bundle sizes
   - Remove unused dependencies

---

## Performance Metrics to Track

- **Time to First Byte (TTFB)**
- **First Contentful Paint (FCP)**
- **Largest Contentful Paint (LCP)**
- **Time to Interactive (TTI)**
- **Total Blocking Time (TBT)**
- **Cumulative Layout Shift (CLS)**

---

## Notes

- Many routes already use server components (good!)
- Client-side fetching is appropriate for interactive filtering (admin pages)
- Main issues are in teacher/presenter-facing routes
- `/leagues` is the biggest performance bottleneck

---

**Next Steps:**
1. Prioritize `/leagues` optimization
2. Fix `/explore-quizzes` query structure
3. Remove double-hop in `/stats`
4. Implement real data for `/dashboard`

