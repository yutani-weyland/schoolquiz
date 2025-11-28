# Custom Quizzes Pages - Performance Analysis

**Date:** 2025-01-27  
**Status:** 🔍 Analysis Complete - Ready for Optimization

---

## Routes Identified

1. **`/custom-quizzes`** - Main custom quizzes page (server component)
2. **`/premium/my-quizzes`** - Alternative my quizzes page (client component - problem!)
3. **`/custom-quizzes/create`** - Create quiz page
4. **`/premium/create-quiz`** - Alternative create quiz page

---

## Critical Performance Issues

### 🚨 Issue #1: Massive Over-Fetching in API Route

**Location:** `apps/admin/src/app/api/premium/custom-quizzes/route.ts` (lines 77-101, 106-133)

**Problem:**
```typescript
// API route fetches ALL rounds and ALL questions for ALL quizzes
include: {
  rounds: {
    include: {
      questions: {
        include: {
          question: true, // Full question data!
        },
      },
    },
  },
}
```

**Impact:**
- For a list view showing 10 quizzes, this fetches potentially **100+ rounds and 1000+ questions**
- Each quiz could have 10 rounds × 20 questions = 200 questions
- This could be **hundreds of KB to MB** of data transferred
- The list view only needs: `id`, `slug`, `title`, `blurb`, `colorHex`, `status`, `createdAt`, `updatedAt`, `shareCount`

**Current State:**
- `/custom-quizzes` uses `custom-quizzes-server.ts` which is BETTER (only fetches metadata)
- `/premium/my-quizzes` uses the API route which is WORSE (fetches everything)

**Severity:** 🔴 CRITICAL - This is the same issue as explore-quizzes had

---

### 🚨 Issue #2: Client-Side Data Fetching

**Location:** `apps/admin/src/app/premium/my-quizzes/page.tsx` (lines 83-133)

**Problem:**
```typescript
// Entire page is client-side with useEffect fetching
useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    const quizzesRes = await fetch('/api/premium/custom-quizzes?includeShared=true')
    // ... client-side fetching
  }
  fetchData()
}, [isPremium, router, viewType, session?.user?.id])
```

**Impact:**
- Slower initial page load (waiting for client JS + API call)
- Worse SEO (no server-rendered content)
- Higher bundle size (all client code loaded upfront)
- No streaming/suspense benefits

**Severity:** 🔴 CRITICAL - Should be server component

---

### ⚠️ Issue #3: No Pagination

**Location:** Both `custom-quizzes-server.ts` and API route

**Problem:**
- Fetches ALL quizzes at once
- No `limit` or `offset` parameters
- No pagination UI

**Impact:**
- Slow queries as quiz count grows
- Large payloads transferred
- Poor UX for users with many quizzes

**Severity:** 🟠 HIGH - Will become worse over time

---

### ⚠️ Issue #4: Sequential Database Queries

**Location:** `custom-quizzes-server.ts` (lines 46-105)

**Problem:**
```typescript
// 3 separate count queries executed sequentially
const quizzesCreatedThisMonth = await prisma.quiz.count(...)
const quizzesSharedThisMonth = await prisma.customQuizShare.count(...)
const totalQuizzes = await prisma.quiz.count(...)
```

**Impact:**
- Could be parallelized with `Promise.all`
- 3 round-trips instead of potentially 1 aggregated query

**Severity:** 🟡 MEDIUM - Minor optimization opportunity

---

### ⚠️ Issue #5: No Caching

**Location:** `custom-quizzes-server.ts`

**Problem:**
- No `unstable_cache` for quizzes or usage data
- Every page load hits the database

**Impact:**
- Unnecessary database load
- Slower responses

**Severity:** 🟡 MEDIUM - Can be improved

---

### ⚠️ Issue #6: Duplicate Routes

**Problem:**
- `/custom-quizzes` and `/premium/my-quizzes` serve similar purposes
- Different implementations (one good, one bad)
- User confusion about which to use

**Severity:** 🟢 LOW - Consolidation opportunity

---

### ⚠️ Issue #7: No Database Indexes

**Location:** Missing indexes for custom quiz queries

**Needed Indexes:**
```sql
-- Custom quizzes by user
CREATE INDEX IF NOT EXISTS idx_quizzes_custom_user_createdAt 
  ON quizzes(quizType, createdByUserId, createdAt DESC)
  WHERE quizType = 'CUSTOM';

-- Custom quiz shares by user
CREATE INDEX IF NOT EXISTS idx_custom_quiz_shares_userId_createdAt
  ON custom_quiz_shares(userId, createdAt DESC);

-- Usage queries
CREATE INDEX IF NOT EXISTS idx_custom_quiz_usage_userId_monthYear
  ON custom_quiz_usage(userId, monthYear);
```

**Severity:** 🟡 MEDIUM - Will improve query performance

---

## Current Architecture

### `/custom-quizzes` (Better Implementation)
```
Server Component (page.tsx)
  ↓
custom-quizzes-server.ts (minimal fetching)
  ↓
CustomQuizzesClient (client component for interactivity)
```

**Strengths:**
- ✅ Server-side rendering
- ✅ Minimal data fetching (only metadata)
- ✅ Parallel fetching (quizzes + usage)
- ✅ Proper Suspense boundaries

**Weaknesses:**
- ⚠️ No pagination
- ⚠️ No caching
- ⚠️ Sequential usage queries

---

### `/premium/my-quizzes` (Worse Implementation)
```
Client Component (full page)
  ↓
useEffect fetching
  ↓
API route (/api/premium/custom-quizzes)
  ↓
MASSIVE over-fetching (rounds + questions)
```

**Strengths:**
- ✅ Has toggle between official/custom quizzes
- ✅ Better UI with toggle switch

**Weaknesses:**
- 🔴 Client-side only
- 🔴 Massive over-fetching
- 🔴 No server rendering
- 🔴 Slower initial load
- 🔴 Larger bundle size

---

## Data Actually Needed for List View

**From `CustomQuizzesClient.tsx` and `premium/my-quizzes/page.tsx`:**
- `id` ✅
- `slug` ✅
- `title` ✅
- `blurb` ✅
- `colorHex` ✅
- `status` ✅
- `createdAt` ✅
- `updatedAt` ✅
- `shareCount` ✅ (via `_count`)
- `isShared` ✅
- `sharedBy` ✅ (only needed for shared quizzes)

**NOT Needed:**
- ❌ `rounds` array
- ❌ `questions` array
- ❌ Full question text/answers
- ❌ Round details

**Current API Route Fetches:** ~95% unnecessary data

---

## Optimization Plan

### Priority 1: Fix Over-Fetching (Critical)

1. **Fix API Route** - Remove nested includes for list endpoint
2. **Add Summary Endpoint** - Separate endpoint for list vs. detail

### Priority 2: Server-Side Rendering (Critical)

1. **Convert `/premium/my-quizzes`** to server component
2. **Merge with `/custom-quizzes`** or choose one canonical route

### Priority 3: Pagination (High)

1. **Add pagination** to `fetchCustomQuizzes`
2. **Add infinite scroll** or "Load More" button
3. **Initial limit:** 12-20 quizzes

### Priority 4: Performance Optimizations (Medium)

1. **Add caching** with `unstable_cache`
2. **Parallelize usage queries** with `Promise.all`
3. **Add database indexes**
4. **Lazy load Framer Motion**

### Priority 5: Code Quality (Low)

1. **Consolidate duplicate routes**
2. **Remove unused code**
3. **Add TypeScript types**

---

## Expected Improvements

### Before Optimization
- **Initial Payload:** ~500KB - 2MB+ (depending on quiz count)
- **Round-Trips:** 2-3 sequential
- **Client JS Bundle:** Large (full page client component)
- **Query Time:** 200-500ms (no indexes, sequential queries)
- **Cache Hits:** 0%

### After Optimization
- **Initial Payload:** ~10-50KB (only metadata)
- **Round-Trips:** 1-2 parallel
- **Client JS Bundle:** ~50% smaller (server-rendered)
- **Query Time:** 50-150ms (indexes, optimized queries)
- **Cache Hits:** ~80-90% (with revalidation)

**Estimated Improvement:** ~95% reduction in data transfer, ~70% faster initial load

---

## Next Steps

1. ✅ Analysis complete
2. ⏳ Fix API route over-fetching
3. ⏳ Add pagination
4. ⏳ Convert `/premium/my-quizzes` to server component
5. ⏳ Add caching
6. ⏳ Add database indexes
7. ⏳ Test and measure

---

**Ready to proceed with optimizations!** 🚀

