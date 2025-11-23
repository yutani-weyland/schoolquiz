# Performance Playbook - Adapted for SchoolQuiz

## 🎯 Context: What's Different in Your Codebase

**Key Differences from Generic Playbook:**
- ✅ Using **Prisma ORM** (not direct Supabase client)
- ✅ Using **NextAuth** (not Supabase auth)
- ✅ Supabase is just the **database host** (PostgreSQL)
- ⚠️ Many pages are still `'use client'` fetching data client-side
- ⚠️ Currently migrating from mock data to database

---

## ✅ **What to KEEP from the Playbook**

### 1. Server Components for Data Fetching (HIGH PRIORITY)
**Status:** ⚠️ **Partially implemented** - Many pages still use `'use client'`

**Current State:**
- `/admin/quizzes/page.tsx` - `'use client'` fetching via API route
- `/quizzes/[slug]/play/page.tsx` - `'use client'` using `useQuiz` hook
- Most admin pages are client components

**Action Items:**
```typescript
// ❌ CURRENT: Client-side fetching
'use client'
export default function QuizPage() {
  const { data, loading } = useQuiz(slug) // Fetches in browser
  // ...
}

// ✅ BETTER: Server component
export default async function QuizPage({ params }: { params: { slug: string } }) {
  const quiz = await getQuizBySlug(params.slug) // Fetches on server
  return <QuizClient quiz={quiz} />
}
```

**Priority:** 🔴 **HIGH** - This will give you the biggest performance win

---

### 2. Static Generation with Revalidation (MEDIUM PRIORITY)
**Status:** ⚠️ **Partially implemented** - Only one route has `revalidate`

**Current State:**
- `apps/admin/src/app/layout.tsx` has `export const dynamic = "force-dynamic"` (too aggressive!)
- Only `quizzes/[slug]/play/layout.tsx` has `revalidate = 3600`

**Action Items:**
```typescript
// ✅ For public quiz pages (most content is static)
export const dynamic = 'force-static'
export const revalidate = 3600 // 1 hour

// ✅ For admin pages (user-specific)
export const dynamic = 'force-dynamic' // Only where needed
```

**Priority:** 🟡 **MEDIUM** - Good for public pages, less critical for admin

---

### 3. Bundle Size Optimization (HIGH PRIORITY)
**Status:** ✅ **Partially done** - You already lazy-load `QuizPlayer`

**Current State:**
- `QuizPlayer` is lazy-loaded ✅
- But many pages import heavy dependencies directly

**Action Items:**
```typescript
// ✅ Already doing this:
const QuizPlayer = lazy(() => import("@/components/quiz/QuizPlayer"))

// ✅ Do this for heavy admin components:
const Chart = dynamic(() => import('@/components/admin/Chart'), { ssr: false })
const DatePicker = dynamic(() => import('@/components/DatePicker'), { ssr: false })
```

**Priority:** 🔴 **HIGH** - Easy wins, big impact

---

### 4. Collapse N+1 Queries (HIGH PRIORITY)
**Status:** ⚠️ **Needs work** - Some queries could be optimized

**Current State:**
- Your Prisma queries use `include` which is good
- But check for loops that fetch data inside loops

**Action Items:**
```typescript
// ❌ BAD: N+1 query
const quizzes = await prisma.quiz.findMany()
for (const quiz of quizzes) {
  const runs = await prisma.run.findMany({ where: { quizId: quiz.id } })
}

// ✅ GOOD: Single query with include
const quizzes = await prisma.quiz.findMany({
  include: {
    _count: { select: { runs: true } }
  }
})
```

**Priority:** 🔴 **HIGH** - Database performance is critical

---

## ❌ **What to SKIP or ADAPT**

### 1. Supabase Client Patterns → Use Prisma Instead
**Skip:** All `@supabase/ssr` and `createServerClient` patterns

**Use Instead:**
```typescript
// ✅ Your current pattern (keep this):
import { prisma } from '@schoolquiz/db'

export async function getQuiz(slug: string) {
  return await prisma.quiz.findUnique({
    where: { slug },
    include: {
      rounds: {
        include: { questions: true }
      }
    }
  })
}
```

---

### 2. Supabase Auth → You're Using NextAuth
**Skip:** All Supabase auth patterns (`supabase.auth.getUser()`, etc.)

**Use Instead:**
```typescript
// ✅ Your current pattern (keep this):
import { getServerSession } from 'next-auth'
import { authOptions } from '@schoolquiz/auth'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}
```

---

### 3. Supabase Edge Functions → Not Needed Yet
**Skip:** Edge functions for now (you can add later if needed)

**Use Instead:**
- Next.js API routes are fine for your scale
- Consider edge functions only if you have >10k concurrent users

---

## 🎯 **Prioritized Action Plan**

### **Phase 1: Quick Wins (This Week)**
1. ✅ **Fix root layout** - Remove `force-dynamic` from root, add to specific routes
2. ✅ **Add static generation** to public quiz pages
3. ✅ **Lazy-load heavy admin components** (charts, date pickers, etc.)
4. ✅ **Add database indexes** on foreign keys (`quizId`, `userId`, `createdAt`)

### **Phase 2: Server Components Migration (Next Week)**
1. ✅ **Convert quiz play page** to server component
2. ✅ **Convert quiz list page** to server component  
3. ✅ **Convert admin quiz detail page** to server component
4. ✅ **Keep client components** only for interactive parts (forms, buttons)

### **Phase 3: Query Optimization (Ongoing)**
1. ✅ **Audit Prisma queries** for N+1 patterns
2. ✅ **Add `select` instead of `include`** where you don't need all fields
3. ✅ **Add pagination** to all list endpoints
4. ✅ **Use `unstable_cache`** for frequently accessed data

---

## 📋 **Adapted Checklist**

```txt
Performance checklist – SchoolQuiz (Prisma Edition)

[ ] Remove `force-dynamic` from root layout, add to specific routes only
[ ] Convert quiz play page (`/quizzes/[slug]/play`) to server component
[ ] Convert quiz list page (`/admin/quizzes`) to server component
[ ] Add `export const revalidate = 3600` to public quiz pages
[ ] Lazy-load heavy admin components (charts, date pickers, editors)
[ ] Audit Prisma queries for N+1 patterns (use `include` properly)
[ ] Add database indexes on `quizId`, `userId`, `createdAt`, `slug`
[ ] Use `select` instead of `include` where you don't need all fields
[ ] Add pagination to all list endpoints (already done for quizzes ✅)
[ ] Use `unstable_cache` for frequently accessed data (achievements, categories)
[ ] Split admin pages into route segments with `Suspense`
[ ] Use `next/font` for fonts (check if already using)
[ ] Use `next/image` for all images (check if already using)
[ ] Add bundle analyzer: `next-bundle-analyzer`
[ ] Monitor slow queries in Supabase dashboard
```

---

## 🚀 **Concrete Example: Quiz Play Page Refactor**

### Current (Client-Side):
```typescript
// apps/admin/src/app/quizzes/[slug]/play/page.tsx
'use client'
export default function QuizPlayPage() {
  const params = useParams()
  const { data, loading, error } = useQuiz(params.slug as string)
  // ... renders after data loads
}
```

### Better (Server Component):
```typescript
// apps/admin/src/app/quizzes/[slug]/play/page.tsx
import { prisma } from '@schoolquiz/db'
import { QuizPlayer } from '@/components/quiz/QuizPlayer'

export const dynamic = 'force-static'
export const revalidate = 3600

export default async function QuizPlayPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const quiz = await prisma.quiz.findUnique({
    where: { slug: params.slug },
    include: {
      rounds: {
        include: {
          quizRoundQuestions: {
            include: { question: true },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { index: 'asc' }
      }
    }
  })

  if (!quiz) {
    return <QuizNotFound />
  }

  // Transform to component format
  const quizData = transformQuizToPlayFormat(quiz)

  return <QuizPlayer quiz={quizData} />
}
```

**Benefits:**
- ✅ HTML rendered on server (faster first paint)
- ✅ No client-side data fetching waterfall
- ✅ Can be cached and served from CDN
- ✅ Better SEO

---

## ⚠️ **What NOT to Do**

1. ❌ **Don't convert everything to server components** - Keep interactive parts client-side
2. ❌ **Don't add edge functions yet** - Premature optimization
3. ❌ **Don't use Supabase client** - You're using Prisma, stick with it
4. ❌ **Don't force-static everything** - Admin pages need to be dynamic
5. ❌ **Don't over-cache** - User-specific data shouldn't be cached

---

## 📊 **Expected Impact**

**Before (Current):**
- Quiz page load: ~2-3s (client fetch + render)
- Admin page load: ~1-2s (client fetch)
- Bundle size: ~500KB+ (all components loaded)

**After (Optimized):**
- Quiz page load: ~200-500ms (server-rendered HTML)
- Admin page load: ~500ms-1s (server-rendered + lazy-loaded)
- Bundle size: ~200-300KB (lazy-loaded components)

---

## 🎯 **Next Steps**

1. **Start with Phase 1** (quick wins) - Can be done in a few hours
2. **Then Phase 2** (server components) - Will take a few days
3. **Monitor and iterate** - Use Vercel Analytics or similar

Want me to start with Phase 1? I can:
- Fix the root layout `force-dynamic` issue
- Add static generation to quiz pages
- Lazy-load heavy admin components
- Add database indexes

