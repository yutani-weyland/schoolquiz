# Architecture Review: SchoolQuiz Platform

**Date**: 2025-01-XX  
**Reviewer**: Senior Engineer  
**Scope**: Next.js 15 + Supabase quiz platform codebase analysis

---

## Step 1: Codebase Understanding

### Next.js App Router Structure

**Main Routes:**
- `/admin/*` - Platform admin dashboard (PlatformAdmin role required)
  - `/admin` - Overview dashboard
  - `/admin/quizzes` - Quiz list (server component with client table)
  - `/admin/quizzes/[id]` - Quiz detail (server component → client component)
  - `/admin/quizzes/builder` - Quiz creation/editing
  - `/admin/organisations` - Organisation management
  - `/admin/users` - User management
  - `/admin/scheduling` - Scheduled jobs
  - `/admin/analytics` - Analytics dashboards
  - `/admin/achievements` - Achievement creator (legacy, to be migrated)
- `/achievements` - Public achievements page
- `/leagues` - League/competition pages
- `/demo`, `/sign-up`, `/upgrade` - Public marketing pages

**Key Patterns:**
- Server Components for data fetching (pages, layouts)
- Client Components for interactivity (tables, forms, modals)
- API routes under `/api/admin/*` for mutations and client-side fetches

### Database & Data Access

**Database Client:**
- Uses **Prisma** (not direct Supabase client) with PostgreSQL connection
- Client initialized in `packages/db/src/client.ts` with lazy loading
- Connection pooling handled by Prisma
- Environment variable: `DATABASE_URL` (PostgreSQL connection string)

**Data Models:**
- `Quiz` - Main quiz entity (slug, title, status, metadata)
- `Round` - Quiz rounds/categories (linked to Quiz via `quizId`)
- `Question` - Questions (linked to Category)
- `QuizRoundQuestion` - Junction table (round ↔ question with ordering)
- `Run` - Quiz session runs (teacher-led sessions)
- `QuizCompletion` - Student completion records
- `User` - Platform users (tier: basic/premium)
- `Organisation` - School/organisation entities
- `Teacher` - Teacher accounts (legacy, being migrated to User)
- `Achievement` - Achievement system

**Schema Notes:**
- Mix of legacy (`Teacher`, `School`) and new (`User`, `Organisation`) models
- Some tables may have missing columns (evidenced by SQL fix files in root)

### Shared UI Components

**Location:** `packages/ui/` and `apps/admin/src/components/`
- shadcn/ui components (Button, Card, Tabs, Select, etc.)
- Custom admin components (`AdminSidebar`, `AdminTopbar`, `DataTable`)
- Quiz-specific components (`QuizCardPreview`, `QuizColorPicker`)
- Motion components using Framer Motion

### Main User Flows

**1. Teacher → Admin Flow:**
```
Login → /admin (overview) 
  → /admin/quizzes (list)
    → /admin/quizzes/[id] (detail/edit)
      → /admin/quizzes/builder (create/edit)
```

**2. Teacher → Quiz Session Flow:**
```
/admin/quizzes/[id] → "Run Quiz" 
  → Quiz session interface (likely separate route, not yet fully implemented)
    → View results/analytics
```

**3. Student/Guest → Quiz Flow:**
```
Public quiz page (route not clearly visible in admin app)
  → Quiz play interface
    → Submit answers
    → View results
```

### Data Flow Sequence (Page Load → Database → Render)

**Example: Quiz List Page (`/admin/quizzes`)**

1. **Server Component** (`apps/admin/src/app/admin/quizzes/page.tsx`)
   - Calls `getQuizzes()` with search params
   - Uses `unstable_cache` for caching (5 min TTL)
   - Executes Prisma queries:
     - `prisma.quiz.findMany()` - Fetch quizzes with selected fields
     - `prisma.quiz.count()` - Get total count
     - `prisma.run.groupBy()` - Get runs count per quiz (separate query)
   - Passes data as props to client component

2. **Client Component** (`QuizzesTable.tsx`)
   - Receives `initialQuizzes` and `initialPagination` as props
   - Uses `useState` to manage local state
   - Client-side sorting/filtering on initial data
   - Additional fetches via `useEffect` for actions (delete, archive, etc.)

**Example: Quiz Detail Page (`/admin/quizzes/[id]`)**

1. **Server Component** (`page.tsx`)
   - Calls `getQuiz(id)` with 30s cache
   - Executes multiple Prisma queries in parallel:
     - `prisma.quiz.findUnique()` - Basic quiz data
     - `prisma.round.findMany()` - Rounds metadata (no questions)
     - `prisma.run.count()` + `prisma.run.aggregate()` - Analytics
   - Then loads questions separately:
     - `prisma.quizRoundQuestion.findMany()` - All questions for all rounds
   - Groups questions by roundId in memory
   - Passes complete data to client component

2. **Client Component** (`AdminQuizDetailClient.tsx`)
   - Receives `initialQuiz` as prop
   - Uses `useState` for local state (tabs, color picker, etc.)
   - Additional fetches:
     - `fetch('/api/admin/quizzes/${quizId}')` - Refresh quiz data
     - `fetch('/api/admin/quizzes?status=published&limit=100')` - Load all quizzes for preview
   - Client-side interactions (tabs, color changes, PDF generation)

### Experimental / Legacy / Unused Code

**Legacy/Experimental:**
- `Teacher` and `School` models (being migrated to `User`/`Organisation`)
- Achievement Creator in old admin (to be migrated to new admin)
- `QuizSessionService` uses localStorage (not yet connected to database)
- Mock data fallbacks in `QuizService` (`USE_MOCK_DATA` env var)
- Multiple SQL fix files in root (suggests schema evolution issues)

**Potentially Unused:**
- `apps/admin/src/app/admin/organisation/[id]` (duplicate of `organisations/[id]`?)
- Some API routes may have duplicate logic (e.g., quiz fetching in both page.tsx and API route)

---

## Step 2: Teacher Session Data Flow

### Typical Teacher Journey: "View Quiz List → Edit Quiz → Run Quiz"

#### Route 1: `/admin/quizzes` (Quiz List)

**Server-Side (page.tsx):**
```typescript
// Query 1: Fetch quizzes (paginated, filtered)
prisma.quiz.findMany({
  where: { /* filters */ },
  select: { /* limited fields */ },
  skip, take, orderBy
})

// Query 2: Count total
prisma.quiz.count({ where })

// Query 3: Get runs count (separate query, could be optimized)
prisma.run.groupBy({
  by: ['quizId'],
  _count: { id: true }
})
```

**Client-Side (QuizzesTable.tsx):**
- Receives data as props (no initial fetch)
- Client-side sorting on received data
- Additional API calls for actions:
  - Delete: `DELETE /api/admin/quizzes/[id]`
  - Archive: `PATCH /api/admin/quizzes/[id]`
  - Generate PDF: `POST /api/admin/quizzes/[id]/pdf`

**Issues:**
- ❌ Runs count fetched separately (N+1 pattern, though batched)
- ❌ Client-side sorting duplicates server-side ordering
- ✅ Good: Limited field selection in query

#### Route 2: `/admin/quizzes/[id]` (Quiz Detail)

**Server-Side (page.tsx):**
```typescript
// Parallel queries (good!)
Promise.all([
  prisma.quiz.findUnique({ /* basic data */ }),
  prisma.round.findMany({ /* rounds metadata */ }),
  prisma.run.count() + aggregate()
])

// Then: Load questions separately
prisma.quizRoundQuestion.findMany({
  where: { roundId: { in: roundIds } }
})
```

**Client-Side (AdminQuizDetailClient.tsx):**
- Receives `initialQuiz` as prop
- Additional fetches:
  - `refreshQuiz()`: `GET /api/admin/quizzes/${quizId}` (duplicates server fetch)
  - `fetchAllQuizzes()`: `GET /api/admin/quizzes?status=published&limit=100` (only when preview opens)

**Issues:**
- ❌ `refreshQuiz()` duplicates server-side data fetch
- ❌ Questions loaded separately (could be optimized with include)
- ✅ Good: Parallel queries for basic data
- ✅ Good: Lazy loading questions (though could be better)

#### Route 3: Quiz Builder/Editor

**Pattern:** Client component with form state
- Likely uses API routes for mutations
- May fetch quiz data client-side if editing

#### Route 4: Running a Quiz (Teacher Session)

**Current State:** Not fully implemented in codebase
- `QuizSessionService` exists but uses localStorage
- No clear route for teacher quiz session interface
- `Run` model exists but session flow unclear

**Expected Flow (based on schema):**
1. Teacher creates/starts a `Run` record
2. Students join via code/link
3. Teacher presents questions
4. Students submit answers
5. Results saved to `QuizCompletion`
6. Analytics aggregated

---

## Step 3: Optimization Targets

### Critical Issues

**1. Duplicate Data Fetching**
- **Location**: Quiz detail page
- **Issue**: Server component fetches quiz data, client component also fetches via `refreshQuiz()`
- **Impact**: Unnecessary database queries, slower page loads
- **Fix**: Use server actions or remove client-side refresh, rely on Next.js revalidation

**2. Separate Runs Count Query**
- **Location**: Quiz list page (`/admin/quizzes`)
- **Issue**: `prisma.run.groupBy()` executed separately after main query
- **Impact**: Extra database round-trip
- **Fix**: Use Prisma `include` with `_count` or raw SQL with JOIN

**3. Questions Loaded Separately**
- **Location**: Quiz detail page
- **Issue**: Questions fetched in second query after rounds
- **Impact**: Two database round-trips instead of one
- **Fix**: Use nested `include` in initial query (may need to optimize select fields)

**4. Client-Side Sorting Duplicates Server Sorting**
- **Location**: `QuizzesTable.tsx`
- **Issue**: Server sorts by `createdAt desc`, client re-sorts on mount
- **Impact**: Unnecessary computation, potential UI flicker
- **Fix**: Remove client-side sort or make it optional (only for user-initiated sorting)

### Performance Issues

**5. Large Data Fetch for Preview**
- **Location**: `AdminQuizDetailClient.tsx` → `fetchAllQuizzes()`
- **Issue**: Fetches 100 published quizzes when preview opens
- **Impact**: Large payload, slow preview open
- **Fix**: Fetch only needed fields, or paginate, or use search

**6. No Request Deduplication**
- **Location**: Multiple components using `useEffect` with `fetch()`
- **Issue**: Same API route may be called multiple times
- **Impact**: Redundant network requests
- **Fix**: Use React Query, SWR, or Next.js `fetch` deduplication

**7. Cache Strategy Inconsistency**
- **Location**: Various pages
- **Issue**: Some use `unstable_cache` (5min), others use 30s, some no cache
- **Impact**: Inconsistent performance, potential stale data
- **Fix**: Standardize cache TTLs, use revalidation tags

**8. Missing Database Indexes**
- **Location**: Database schema
- **Issue**: Evidence of missing indexes (SQL fix files suggest performance issues)
- **Impact**: Slow queries on large datasets
- **Fix**: Review and add indexes on frequently queried fields (quizId, status, createdAt, etc.)

### Architecture Issues

**9. Mixed Data Fetching Patterns**
- **Location**: Throughout app
- **Issue**: Some pages use server components, others use client + API routes
- **Impact**: Inconsistent patterns, harder to optimize
- **Fix**: Standardize on server components for initial load, API routes only for mutations

**10. Legacy Models Still in Use**
- **Location**: `Teacher`, `School` models
- **Issue**: Migration to `User`/`Organisation` incomplete
- **Impact**: Code complexity, potential data inconsistency
- **Fix**: Complete migration or create abstraction layer

**11. No Query Result Caching Layer**
- **Location**: Prisma queries
- **Issue**: Every page load hits database (even with `unstable_cache`, it's per-request)
- **Impact**: Database load, slower responses
- **Fix**: Consider Redis cache for frequently accessed data, or optimize `unstable_cache` usage

**12. Client-Side State Management**
- **Location**: Components using `useState` for server data
- **Issue**: No centralized state management, potential prop drilling
- **Impact**: Harder to share data between components
- **Fix**: Consider React Context or Zustand for shared state (only if needed)

### Data Efficiency Issues

**13. Over-fetching in List Views**
- **Location**: Quiz list queries
- **Issue**: May be fetching more fields than needed for table display
- **Impact**: Larger payloads, slower queries
- **Fix**: Review `select` clauses, ensure only needed fields

**14. Missing Pagination on Some Queries**
- **Location**: `fetchAllQuizzes()` and similar
- **Issue**: Fetching 100+ records without pagination
- **Impact**: Large payloads, memory usage
- **Fix**: Implement proper pagination or limit to reasonable size

**15. No Data Prefetching**
- **Location**: Navigation between pages
- **Issue**: Data only fetched when page loads
- **Impact**: Perceived slowness
- **Fix**: Use Next.js `prefetch` or `router.prefetch()` for likely next pages

---

## Summary: Architecture Sketch

### Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Server       │  │ Client       │  │ API Routes   │  │
│  │ Components   │→ │ Components   │← │ /api/admin/* │  │
│  │ (page.tsx)   │  │ (use client) │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                             │
└────────────────────────────┼─────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Prisma ORM    │
                    │  (packages/db)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Supabase       │
                    │  PostgreSQL     │
                    └─────────────────┘
```

### Data Flow Pattern

**Server Component Pattern (Good):**
```
Request → Server Component → Prisma Query → Render HTML → Client Hydration
```

**Client + API Pattern (Needs Optimization):**
```
Request → Server Component → Initial Data → Client Component 
  → useEffect → fetch('/api/...') → Prisma Query → Update State
```

### Key Findings

1. **Good**: Using server components for initial data fetch
2. **Good**: Prisma with proper connection pooling
3. **Issue**: Mixed patterns (server + client fetches)
4. **Issue**: Some duplicate queries (server + client)
5. **Issue**: Missing query optimizations (separate queries, no joins)
6. **Issue**: Inconsistent caching strategy

---

## Recommended Next Steps (Priority Order)

1. **Fix duplicate fetching** in quiz detail page (remove client-side refresh or use server actions)
2. **Optimize runs count query** (use include/_count or JOIN)
3. **Combine questions query** with rounds query (nested include)
4. **Standardize caching** strategy across all pages
5. **Add database indexes** for frequently queried fields
6. **Remove client-side sorting** duplication
7. **Implement request deduplication** (React Query or SWR)
8. **Complete User/Organisation migration** (remove legacy models)
9. **Add query result caching** layer (Redis or similar)
10. **Review and optimize select clauses** (ensure minimal data fetching)

---

**End of Review**

