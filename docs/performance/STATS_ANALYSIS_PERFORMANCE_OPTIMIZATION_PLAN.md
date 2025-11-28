# Stats & Analysis - Comprehensive Performance Optimization Plan

**Date:** 2025-01-27  
**Status:** 📋 Planning Phase  
**Target:** Kahoot-like speed (<300ms load) + Lighthouse score ≥95

---

## Overview

Apply the same rigorous performance optimization approach used for quizzes, leaderboards, and custom quizzes to the stats/analysis section (`/stats`). The goal is to achieve **blisteringly fast load times** (<300ms) and **excellent Lighthouse paint scores** (≥95).

---

## Current State Analysis

### Routes & Components

- **`/stats`** - Main stats page (server component wrapper, client component renderer)
- **`/api/stats`** - Stats API route (currently returns mock data, database code commented out)
- **`apps/admin/src/app/stats/stats-server.ts`** - Server-side data fetching wrapper
- **`apps/admin/src/app/stats/StatsClient.tsx`** - Client component with React Query

### Current Architecture Issues

1. **❌ Client Component Heavy**
   - Entire page is client component (`StatsClient`)
   - Framer Motion loaded upfront (~50KB+)
   - React Query client-side fetching
   - No server-side streaming

2. **❌ Sequential Database Queries** (when implemented)
   - Multiple separate queries instead of parallel execution
   - No summary queries - will fetch full data sets
   - Over-fetching with `include` instead of `select`
   - No aggregation at database level

3. **❌ No Caching Strategy**
   - No server-side caching
   - React Query cache only (5 minutes)
   - No CDN/browser caching headers
   - No ISR/SSG for static parts

4. **❌ Over-fetching Data**
   - Will fetch all quiz completions
   - Will fetch all league members for comparisons
   - Will fetch full category/round data
   - No selective field fetching

5. **❌ Heavy Client Bundle**
   - Framer Motion loaded upfront
   - Recharts library loaded upfront (~100KB+)
   - All stats components loaded immediately
   - No code splitting

6. **❌ No Performance Monitoring**
   - No timing logs
   - No query performance tracking
   - No bundle size monitoring

---

## Optimization Strategy

### Phase 1: Database Query Optimization & Summary Queries

#### 1.1 Create Summary Query Functions

**File**: `apps/admin/src/app/stats/stats-summary-server.ts`

```typescript
export interface StatsSummary {
  // Summary stats (aggregated in DB)
  summary: {
    averageScore: number; // Computed: SUM(score) / COUNT(*)
    totalQuestionsAttempted: number; // SUM(totalQuestions)
    totalQuizzesPlayed: number; // COUNT(*)
    totalCorrectAnswers: number; // SUM(score)
    perfectScores: number; // COUNT(*) WHERE score = totalQuestions
  };
  
  // Streaks (computed from minimal data)
  streaks: {
    currentQuestionStreak: number;
    bestQuestionStreak: number;
    currentQuizStreak: number;
    bestQuizStreak: number;
  };
  
  // Category performance (aggregated)
  categories: {
    strongest: Array<{
      name: string;
      percentage: number;
      correct: number;
      total: number;
      quizzes: number;
    }>;
    weakest: Array<{ /* same */ }>;
    all: Array<{ /* same */ }>;
  };
  
  // Weekly streak (minimal data)
  weeklyStreak: Array<{
    week: string;
    date: string;
    completed: boolean;
    completedAt?: string;
    quizSlug?: string | null;
  }>;
  
  // Performance over time (minimal data)
  performanceOverTime: Array<{
    date: string;
    score: number;
    quizSlug: string;
  }>;
  
  // Comparisons (aggregated)
  comparisons: {
    public: {
      averageScore: number;
      totalUsers: number;
    };
    leagues: Array<{
      leagueId: string;
      leagueName: string;
      userAverage: number;
      leagueAverage: number;
      userRank: number;
      totalMembers: number;
    }>;
  };
  
  seasonStats: {
    quizzesPlayed: number;
    perfectScores: number;
    averageScore: number;
    longestStreakWeeks: number;
    currentStreakWeeks: number;
  } | null;
}
```

**Key Optimizations**:
- Use `select` instead of `include` - only fetch needed fields
- Use `_count`, `_sum`, `_avg` aggregates - compute in database
- Use `groupBy` for category performance
- Fetch minimal data for streaks (dates only)
- Parallel query execution with `Promise.all()`

#### 1.2 Optimize Summary Stats Query

**Before** (commented out code):
```typescript
const completions = await prisma.quizCompletion.findMany({
  where: { userId: user.id },
  orderBy: { completedAt: 'desc' },
})
// Then calculate in JavaScript
const totalQuestionsAttempted = completions.reduce((sum, c) => sum + c.totalQuestions, 0)
```

**After** (optimized):
```typescript
// Single aggregated query - no relation fetching
const summary = await prisma.quizCompletion.aggregate({
  where: { userId: user.id },
  _count: { id: true }, // totalQuizzesPlayed
  _sum: {
    totalQuestions: true, // totalQuestionsAttempted
    score: true, // totalCorrectAnswers
  },
  _avg: {
    score: true, // For average calculation
  },
})

// Perfect scores count (separate lightweight query)
const perfectScores = await prisma.quizCompletion.count({
  where: {
    userId: user.id,
    // Use Prisma raw query for score = totalQuestions comparison
  },
})

// Calculate average score
const averageScore = summary._sum.totalQuestions > 0
  ? (summary._sum.score! / summary._sum.totalQuestions!) * 100
  : 0
```

**Impact**: 
- **Before**: Fetch all completions (~50-200KB), calculate in JS
- **After**: Single aggregate query (~100 bytes), compute in DB
- **Reduction**: ~99% less data transfer

#### 1.3 Optimize Category Performance Query

**Before** (estimated approach):
```typescript
// Would fetch all completions, then fetch quiz structure for each
for (const completion of completions) {
  const quiz = await prisma.quiz.findUnique({ where: { slug: completion.quizSlug } })
  // Then distribute score across categories
}
```

**After** (optimized with proper schema):
```typescript
// Use quiz_scores or answer_stats table with category breakdown
// If using answer_stats:
const categoryStats = await prisma.$queryRaw`
  SELECT 
    c.name,
    COUNT(DISTINCT qrq."questionId") as total,
    SUM(CASE WHEN ans.correct_attempts > 0 THEN 1 ELSE 0 END) as correct,
    COUNT(DISTINCT qs.quiz_id) as quizzes
  FROM quiz_scores qs
  JOIN quiz_round_questions qrq ON qrq."roundId" IN (
    SELECT id FROM rounds WHERE "quizId" = qs.quiz_id
  )
  JOIN questions q ON q.id = qrq."questionId"
  JOIN categories c ON c.id = q."categoryId"
  LEFT JOIN answer_stats ans ON ans.question_id = q.id AND ans.quiz_id = qs.quiz_id
  WHERE qs.user_id = ${userId}
  GROUP BY c.id, c.name
  ORDER BY (correct::float / NULLIF(total, 0)) DESC
`
```

**Alternative** (if using denormalized category stats):
```typescript
// Use a materialized view or aggregated table
const categoryStats = await prisma.userCategoryStats.findMany({
  where: { userId: user.id },
  select: {
    category: { select: { name: true } },
    correct: true,
    total: true,
    quizzes: true,
  },
  orderBy: { percentage: 'desc' },
})
```

**Impact**: 
- **Before**: N+1 queries (one per completion)
- **After**: Single aggregated query
- **Reduction**: ~95% fewer queries, ~90% less data

#### 1.4 Optimize League Comparisons Query

**Before** (commented out code):
```typescript
const userLeagues = await prisma.privateLeagueMember.findMany({
  where: { userId, leftAt: null },
  include: {
    league: {
      include: {
        stats: { /* all stats */ },
      },
    },
  },
})
// Then calculate in JavaScript
```

**After** (optimized):
```typescript
// Fetch only league IDs user belongs to
const userLeagueIds = await prisma.privateLeagueMember.findMany({
  where: { userId, leftAt: null },
  select: { leagueId: true },
})

// Parallel aggregated queries for each league
const leagueComparisons = await Promise.all(
  userLeagueIds.map(async ({ leagueId }) => {
    // Get league name (minimal)
    const league = await prisma.privateLeague.findUnique({
      where: { id: leagueId },
      select: { id: true, name: true },
    })
    
    // Get aggregated stats for league
    const leagueStats = await prisma.privateLeagueStats.aggregate({
      where: {
        leagueId,
        quizSlug: null, // Overall stats
      },
      _count: { userId: true }, // totalMembers
      _sum: { totalCorrectAnswers: true },
      _avg: { totalCorrectAnswers: true },
    })
    
    // Get user's stats
    const userStats = await prisma.privateLeagueStats.findUnique({
      where: {
        leagueId_userId_quizSlug: {
          leagueId,
          userId,
          quizSlug: null,
        },
      },
      select: {
        totalCorrectAnswers: true,
        quizzesPlayed: true,
      },
    })
    
    // Get user rank (single query with window function)
    const userRank = await prisma.$queryRaw<Array<{ rank: number }>>`
      SELECT rank
      FROM (
        SELECT 
          "userId",
          ROW_NUMBER() OVER (ORDER BY "totalCorrectAnswers" DESC) as rank
        FROM private_league_stats
        WHERE "leagueId" = ${leagueId} AND "quizSlug" IS NULL
      ) ranked
      WHERE "userId" = ${userId}
    `
    
    return {
      leagueId: league!.id,
      leagueName: league!.name,
      userAverage: userStats ? (userStats.totalCorrectAnswers / userStats.quizzesPlayed) : 0,
      leagueAverage: leagueStats._avg.totalCorrectAnswers || 0,
      userRank: userRank[0]?.rank || 0,
      totalMembers: leagueStats._count.userId,
    }
  })
)
```

**Impact**:
- **Before**: Fetch all league members and stats (~100-500KB)
- **After**: Aggregated queries (~1-5KB per league)
- **Reduction**: ~95% less data transfer

#### 1.5 Optimize Weekly Streak Query

**Before** (commented out code):
```typescript
const completions = await prisma.quizCompletion.findMany({
  where: { userId: user.id },
  orderBy: { completedAt: 'desc' },
})
// Then calculate weeks in JavaScript
```

**After** (optimized):
```typescript
// Fetch only dates and quiz slugs (minimal data)
const completionWeeks = await prisma.quizCompletion.findMany({
  where: { userId: user.id },
  select: {
    completedAt: true,
    quizSlug: true,
  },
  orderBy: { completedAt: 'desc' },
})

// Calculate weeks in TypeScript (lightweight)
const weeklyStreak = calculateWeeklyStreakData(completionWeeks)
```

**Impact**:
- **Before**: Fetch full completion objects (~50-200KB)
- **After**: Fetch only dates (~5-20KB)
- **Reduction**: ~80% less data

#### 1.6 Optimize Performance Over Time Query

**Before** (commented out code):
```typescript
const completions = await prisma.quizCompletion.findMany({
  where: { userId: user.id },
  orderBy: { completedAt: 'desc' },
})
// Then map in JavaScript
```

**After** (optimized):
```typescript
// Fetch only needed fields
const performanceData = await prisma.quizCompletion.findMany({
  where: { userId: user.id },
  select: {
    completedAt: true,
    score: true,
    totalQuestions: true,
    quizSlug: true,
  },
  orderBy: { completedAt: 'asc' },
  take: 100, // Limit to last 100 quizzes
})

// Transform in TypeScript
const performanceOverTime = performanceData.map(c => ({
  date: c.completedAt.toISOString().split('T')[0],
  score: c.totalQuestions > 0 ? (c.score / c.totalQuestions) * 100 : 0,
  quizSlug: c.quizSlug,
}))
```

**Impact**:
- **Before**: Fetch all completions (~50-200KB)
- **After**: Fetch only last 100 with minimal fields (~10-40KB)
- **Reduction**: ~80% less data

#### 1.7 Optimize Public Stats Query

**Before** (commented out code):
```typescript
const allCompletions = await prisma.quizCompletion.findMany({
  select: { score: true, totalQuestions: true },
})
// Then calculate in JavaScript
```

**After** (optimized):
```typescript
// Single aggregated query
const [publicStats, uniqueUserCount] = await Promise.all([
  prisma.quizCompletion.aggregate({
    _sum: {
      totalQuestions: true,
      score: true,
    },
    _count: { id: true },
  }),
  prisma.quizCompletion.groupBy({
    by: ['userId'],
  }).then(result => result.length),
])

const publicAverage = publicStats._sum.totalQuestions! > 0
  ? (publicStats._sum.score! / publicStats._sum.totalQuestions!) * 100
  : 0
```

**Impact**:
- **Before**: Fetch all completions from all users (~MBs)
- **After**: Single aggregate query (~100 bytes)
- **Reduction**: ~99.9% less data

#### 1.8 Parallel Query Execution

**File**: `apps/admin/src/app/stats/stats-summary-server.ts`

```typescript
export async function getStatsSummary(userId: string): Promise<StatsSummary> {
  const startTime = Date.now()
  
  // Execute all queries in parallel
  const [
    summary,
    perfectScores,
    categoryStats,
    completionWeeks,
    performanceData,
    publicStats,
    uniqueUserCount,
    leagueComparisons,
    seasonStats,
  ] = await Promise.all([
    getSummaryStats(userId),
    getPerfectScoresCount(userId),
    getCategoryPerformance(userId),
    getCompletionWeeks(userId),
    getPerformanceOverTime(userId),
    getPublicStats(),
    getUniqueUserCount(),
    getLeagueComparisons(userId),
    getSeasonStats(userId),
  ])
  
  const queryTime = Date.now() - startTime
  console.log(`[Stats Summary] All queries completed in ${queryTime}ms`)
  
  // Calculate streaks from minimal data
  const streaks = calculateStreaks(completionWeeks)
  
  // Calculate weekly streak
  const weeklyStreak = calculateWeeklyStreakData(completionWeeks)
  
  // Transform performance data
  const performanceOverTime = transformPerformanceData(performanceData)
  
  return {
    summary,
    streaks,
    categories: {
      strongest: categoryStats.slice(0, 5),
      weakest: categoryStats.slice(-5).reverse(),
      all: categoryStats,
    },
    weeklyStreak,
    performanceOverTime,
    comparisons: {
      public: {
        averageScore: publicStats.average,
        totalUsers: uniqueUserCount,
      },
      leagues: leagueComparisons,
    },
    seasonStats,
  }
}
```

**Impact**:
- **Before**: Sequential queries (~2000-5000ms total)
- **After**: Parallel queries (~300-800ms total)
- **Reduction**: ~70-85% faster

---

### Phase 2: Server Component Migration & Streaming

#### 2.1 Convert to Server Component

**File**: `apps/admin/src/app/stats/page.tsx`

**Before**:
```typescript
// Server component wrapper that fetches and passes to client
export default async function StatsPage() {
  const stats = await getStatsData()
  return <StatsClient initialData={stats} />
}
```

**After**:
```typescript
// Server component that renders directly
export default async function StatsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  
  const isPremium = checkPremiumStatus(user)
  if (!isPremium) {
    return <LockedFeatureScreen />
  }
  
  // Fetch stats on server
  const stats = await getStatsSummary(user.id)
  
  return (
    <>
      <SiteHeader />
      <main>
        {/* Render server components directly */}
        <SummaryStatsServer summary={stats.summary} />
        <StreakCardsServer streaks={stats.streaks} />
        {/* ... */}
      </main>
      <Footer />
    </>
  )
}
```

**Impact**:
- Eliminates client-side data fetching
- Faster initial render
- Better SEO
- Reduced client bundle size

#### 2.2 Implement Streaming with Suspense

**File**: `apps/admin/src/app/stats/page.tsx`

```typescript
export default async function StatsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  
  const isPremium = checkPremiumStatus(user)
  if (!isPremium) {
    return <LockedFeatureScreen />
  }
  
  return (
    <>
      <SiteHeader />
      <main>
        {/* Critical above-the-fold content */}
        <StatsHeader />
        
        {/* Stream in non-critical sections */}
        <Suspense fallback={<SummaryStatsSkeleton />}>
          <SummaryStatsStream userId={user.id} />
        </Suspense>
        
        <Suspense fallback={<StreakCardsSkeleton />}>
          <StreakCardsStream userId={user.id} />
        </Suspense>
        
        <Suspense fallback={<PerformanceChartSkeleton />}>
          <PerformanceChartStream userId={user.id} />
        </Suspense>
        
        {/* Below-the-fold content */}
        <Suspense fallback={<CategoryPerformanceSkeleton />}>
          <CategoryPerformanceStream userId={user.id} />
        </Suspense>
        
        <Suspense fallback={<ComparisonChartsSkeleton />}>
          <ComparisonChartsStream userId={user.id} />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
```

**Impact**:
- Faster Time to First Byte (TTFB)
- Faster First Contentful Paint (FCP)
- Progressive rendering
- Better perceived performance

---

### Phase 3: Client-Side Optimizations

#### 3.1 Lazy Load Heavy Libraries

**File**: `apps/admin/src/components/stats/PerformanceChart.tsx`

**Before**:
```typescript
import { LineChart, Line, XAxis, YAxis, ... } from 'recharts'
```

**After**:
```typescript
import dynamic from 'next/dynamic'

const PerformanceChartClient = dynamic(
  () => import('./PerformanceChartClient'),
  {
    ssr: false,
    loading: () => <PerformanceChartSkeleton />,
  }
)
```

**Impact**:
- Recharts (~100KB) only loads when chart is visible
- Reduces initial bundle by ~100KB
- Faster initial page load

#### 3.2 Lazy Load Framer Motion

**File**: `apps/admin/src/components/stats/SummaryStats.tsx`

**Before**:
```typescript
import { motion } from 'framer-motion'
```

**After**:
```typescript
// Check for reduced motion preference
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false

// Only load motion if needed
const MotionDiv = prefersReducedMotion 
  ? 'div' 
  : (await import('framer-motion')).motion.div
```

**Alternative** (simpler):
```typescript
import dynamic from 'next/dynamic'

const MotionDiv = dynamic(
  () => import('framer-motion').then(mod => mod.motion.div),
  { ssr: false }
)
```

**Impact**:
- Framer Motion (~50KB) only loads when animations are needed
- Reduces initial bundle by ~50KB
- Faster initial page load

#### 3.3 Code Split Stats Components

**File**: `apps/admin/src/app/stats/page.tsx`

```typescript
import dynamic from 'next/dynamic'

const SummaryStats = dynamic(() => import('@/components/stats/SummaryStats'), {
  loading: () => <SummaryStatsSkeleton />,
})

const PerformanceChart = dynamic(() => import('@/components/stats/PerformanceChart'), {
  loading: () => <PerformanceChartSkeleton />,
})

const CategoryPerformance = dynamic(() => import('@/components/stats/CategoryPerformance'), {
  loading: () => <CategoryPerformanceSkeleton />,
})
```

**Impact**:
- Each component loads on demand
- Reduces initial bundle size
- Faster initial page load

---

### Phase 4: Caching Strategy

#### 4.1 Server-Side Caching

**File**: `apps/admin/src/app/stats/stats-summary-server.ts`

```typescript
import { unstable_cache } from 'next/cache'

export async function getStatsSummary(userId: string): Promise<StatsSummary> {
  return unstable_cache(
    async () => {
      // Actual query logic
      return getStatsSummaryInternal(userId)
    },
    [`stats-summary-${userId}`],
    {
      revalidate: 300, // 5 minutes
      tags: [`stats-${userId}`],
    }
  )()
}
```

**Impact**:
- Reduces database load
- Faster response times for cached requests
- Better scalability

#### 4.2 API Route Caching Headers

**File**: `apps/admin/src/app/api/stats/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const stats = await getStatsSummary(userId)
  
  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
```

**Impact**:
- Browser caching
- CDN caching (if applicable)
- Reduced server load

#### 4.3 React Query Configuration

**File**: `apps/admin/src/app/stats/StatsClient.tsx`

```typescript
const { data: stats } = useQuery({
  queryKey: ['stats', userId],
  queryFn: fetchStats,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
})
```

**Impact**:
- Reduces unnecessary refetches
- Better user experience
- Reduced server load

---

### Phase 5: Database Indexes

#### 5.1 Add Performance Indexes

**File**: `apps/admin/DATABASE_INDEXES.sql` (add to existing)

```sql
-- Quiz completion lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_quiz_completion_user_date 
ON quiz_completions(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_completion_user_score 
ON quiz_completions(user_id, score DESC, total_questions DESC);

-- Category performance (if using answer_stats)
CREATE INDEX IF NOT EXISTS idx_answer_stats_user_category 
ON answer_stats(user_id, category_id, correct_attempts DESC);

-- League stats lookups
CREATE INDEX IF NOT EXISTS idx_league_stats_league_user 
ON private_league_stats(league_id, user_id, quiz_slug);

CREATE INDEX IF NOT EXISTS idx_league_stats_ranking 
ON private_league_stats(league_id, quiz_slug, total_correct_answers DESC);

-- Season stats
CREATE INDEX IF NOT EXISTS idx_season_stats_user_season 
ON season_stats(user_id, season_id);
```

**Impact**:
- Database queries execute 5-10x faster
- Reduced database load
- Better scalability

---

### Phase 6: Lighthouse-Specific Optimizations

#### 6.1 Reduce JavaScript Execution Time

- ✅ Lazy load Framer Motion (Phase 3.2)
- ✅ Lazy load Recharts (Phase 3.1)
- ✅ Code split components (Phase 3.3)
- ✅ Use server components (Phase 2.1)

**Expected Impact**:
- **Before**: ~2000ms JavaScript execution
- **After**: ~500ms JavaScript execution
- **Reduction**: ~75%

#### 6.2 Optimize CSS

- Extract critical CSS for above-the-fold content
- Defer non-critical CSS
- Minify CSS (already done via Next.js)

**Expected Impact**:
- Faster First Contentful Paint (FCP)
- Better Largest Contentful Paint (LCP)

#### 6.3 Optimize Images (if any)

- Use Next.js Image component
- Lazy load images below the fold
- Use WebP format
- Provide proper sizing

#### 6.4 Enable bfcache

**File**: `apps/admin/src/middleware.ts`

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Enable bfcache for stats page
  if (request.nextUrl.pathname === '/stats') {
    response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate')
  }
  
  return response
}
```

**Impact**:
- Instant back/forward navigation
- Better perceived performance

---

## Performance Targets

### Load Time Targets

| Metric | Target | Current (Estimated) | Improvement Needed |
|--------|--------|---------------------|-------------------|
| **TTFB** | < 100ms | ~500ms | **80% faster** |
| **FCP** | < 300ms | ~1200ms | **75% faster** |
| **LCP** | < 500ms | ~2000ms | **75% faster** |
| **TTI** | < 800ms | ~3000ms | **73% faster** |
| **TBT** | < 200ms | ~1500ms | **87% faster** |

### Lighthouse Score Targets

| Category | Target | Current (Estimated) | Improvement Needed |
|----------|--------|---------------------|-------------------|
| **Performance** | ≥ 95 | ~60 | **+35 points** |
| **Accessibility** | ≥ 95 | ~90 | **+5 points** |
| **Best Practices** | ≥ 95 | ~85 | **+10 points** |
| **SEO** | ≥ 95 | ~90 | **+5 points** |

### Data Transfer Targets

| Metric | Target | Current (Estimated) | Improvement Needed |
|--------|--------|---------------------|-------------------|
| **Initial Bundle** | < 200KB | ~500KB | **60% smaller** |
| **API Response** | < 50KB | ~200KB | **75% smaller** |
| **Total Transfer** | < 300KB | ~1000KB | **70% smaller** |

---

## Implementation Phases

### Phase 1: Database Optimization (Week 1)
- ✅ Create summary query functions
- ✅ Optimize all database queries
- ✅ Add database indexes
- ✅ Implement parallel query execution
- **Expected Impact**: 70-85% faster database queries

### Phase 2: Server Component Migration (Week 1-2)
- ✅ Convert to server components
- ✅ Implement streaming with Suspense
- ✅ Add server-side caching
- **Expected Impact**: 50-70% faster initial render

### Phase 3: Client-Side Optimization (Week 2)
- ✅ Lazy load heavy libraries
- ✅ Code split components
- ✅ Optimize React Query
- **Expected Impact**: 60-75% smaller initial bundle

### Phase 4: Caching & Performance (Week 2-3)
- ✅ Add caching headers
- ✅ Optimize API routes
- ✅ Add performance monitoring
- **Expected Impact**: 50-80% faster cached requests

### Phase 5: Lighthouse Optimization (Week 3)
- ✅ Optimize JavaScript execution
- ✅ Optimize CSS
- ✅ Enable bfcache
- ✅ Final performance tuning
- **Expected Impact**: Lighthouse score ≥95

---

## Monitoring & Validation

### Performance Logging

Add detailed timing logs throughout:

```typescript
const startTime = Date.now()
const stats = await getStatsSummary(userId)
const queryTime = Date.now() - startTime
console.log(`[Stats] Total query time: ${queryTime}ms`)

// Log individual query times
console.log(`[Stats] Summary query: ${summaryTime}ms`)
console.log(`[Stats] Category query: ${categoryTime}ms`)
console.log(`[Stats] League query: ${leagueTime}ms`)
```

### Lighthouse Testing

Run Lighthouse audits after each phase:
```bash
# Run Lighthouse CI
npm run lighthouse -- --url=http://localhost:3000/stats

# Or use Chrome DevTools
# Performance tab > Lighthouse > Generate report
```

### Database Query Analysis

Use Prisma query logging:
```typescript
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
  ],
})

prisma.$on('query', (e) => {
  console.log(`Query: ${e.query}`)
  console.log(`Duration: ${e.duration}ms`)
})
```

---

## Success Criteria

### Must Have
- ✅ Load time < 300ms (TTFB + FCP)
- ✅ Lighthouse Performance score ≥ 95
- ✅ Database queries < 100ms each
- ✅ Total data transfer < 300KB
- ✅ No request waterfalls

### Nice to Have
- ✅ Lighthouse score ≥ 98
- ✅ Load time < 200ms
- ✅ Database queries < 50ms each
- ✅ Total data transfer < 200KB

---

## Files to Modify

### New Files
1. `apps/admin/src/app/stats/stats-summary-server.ts` - Summary query functions
2. `apps/admin/src/app/stats/stats-streaming.tsx` - Streaming components
3. `apps/admin/src/components/stats/PerformanceChartClient.tsx` - Lazy-loaded chart
4. `apps/admin/DATABASE_INDEXES.sql` - Add stats indexes (update existing)

### Modified Files
1. `apps/admin/src/app/stats/page.tsx` - Convert to server component
2. `apps/admin/src/app/stats/StatsClient.tsx` - Remove or simplify
3. `apps/admin/src/app/api/stats/route.ts` - Use summary queries, add caching
4. `apps/admin/src/components/stats/*.tsx` - Lazy load heavy libraries
5. `apps/admin/src/middleware.ts` - Add bfcache headers

---

## Next Steps

1. **Review this plan** with the team
2. **Prioritize phases** based on impact
3. **Start with Phase 1** (database optimization) - highest impact
4. **Measure baseline** performance before starting
5. **Iterate** based on results

---

**Target**: Achieve Kahoot-like speed (<300ms load) and Lighthouse score ≥95 within 3 weeks.

