# Code Review: Database Integration Readiness

**Focus:** Quiz play experience, admin quiz/question/round/achievement management  
**Goal:** Identify structural issues that will complicate database integration

---

## 🔴 HIGH PRIORITY - Critical for Database Integration

### 1. Quiz Data Duplication Across Multiple Files

**Files:**
- `apps/admin/src/app/quizzes/[slug]/play/page.tsx` - `QUIZ_DATA` object (500+ lines)
- `apps/admin/src/app/api/quizzes/[slug]/data/route.ts` - Duplicate `QUIZ_DATA` object
- `apps/admin/src/app/demo/page.tsx` - `QUIZ_QUESTIONS` array

**Problem:**
- Same quiz data hardcoded in 3+ places
- Changes require updates in multiple files
- No single source of truth
- When switching to DB, need to update all locations
- Risk of inconsistencies between API and component data

**Refactor:**
```typescript
// Create: apps/admin/src/lib/mock/quiz-fixtures.ts
export const MOCK_QUIZ_DATA: Record<string, QuizData> = {
  "12": { rounds: [...], questions: [...] },
  // ... all quiz data here
}

// Update API route:
import { MOCK_QUIZ_DATA } from '@/lib/mock/quiz-fixtures'
export async function GET(...) {
  const quizData = MOCK_QUIZ_DATA[slug] || await fetchFromDatabase(slug)
  return NextResponse.json(quizData)
}

// Update play page:
import { MOCK_QUIZ_DATA } from '@/lib/mock/quiz-fixtures'
const quizData = MOCK_QUIZ_DATA[slug] || await fetchQuizData(slug)
```

**Priority:** 🔴 **HIGH**

---

### 2. QuizPlayer Component: Massive File with Mixed Responsibilities

**File:** `apps/admin/src/components/quiz/QuizPlayer.tsx` (1800+ lines)

**Problems:**
- **UI + Data + Business Logic + State Management** all in one component
- 84+ `useState`/`useEffect` calls
- Direct localStorage/sessionStorage access scattered throughout
- Achievement logic embedded in component
- Timer logic mixed with quiz state
- Hard to test, hard to refactor
- When adding DB, need to extract data layer but component is too tangled

**Key Issues:**
```typescript
// Lines 311-1818: Everything in one component
- State: currentIndex, currentRound, viewedQuestions, revealedAnswers, correctAnswers, timer, achievements, etc.
- Data fetching: None (receives props, but manages state internally)
- Business logic: Achievement checking, completion logic, scoring
- UI: Rendering, animations, keyboard shortcuts
- Storage: localStorage for completion, sessionStorage for timer
```

**Refactor:**
```typescript
// Extract: apps/admin/src/hooks/useQuizPlay.ts
export function useQuizPlay(quizSlug: string, questions: QuizQuestion[], rounds: QuizRound[]) {
  // All quiz state management
  // Returns: { currentIndex, goToNext, goToPrevious, markCorrect, ... }
}

// Extract: apps/admin/src/hooks/useQuizTimer.ts
export function useQuizTimer(quizSlug: string) {
  // Timer logic with sessionStorage
}

// Extract: apps/admin/src/hooks/useQuizAchievements.ts
export function useQuizAchievements(quizSlug: string, correctAnswers: Set<number>, ...) {
  // Achievement checking logic
}

// Extract: apps/admin/src/services/quizCompletion.ts
export async function saveQuizCompletion(quizSlug: string, score: number) {
  // API call to save completion
  // Replace localStorage.setItem
}

// Simplified QuizPlayer:
export function QuizPlayer({ quizSlug, questions, rounds, ... }) {
  const quizPlay = useQuizPlay(quizSlug, questions, rounds)
  const timer = useQuizTimer(quizSlug)
  const achievements = useQuizAchievements(quizSlug, quizPlay.correctAnswers, ...)
  
  // Only UI rendering
}
```

**Priority:** 🔴 **HIGH**

---

### 3. No Data Access Layer - Direct Props/State Everywhere

**Files:**
- `apps/admin/src/app/quizzes/[slug]/play/page.tsx` - Fetches from hardcoded `QUIZ_DATA`
- `apps/admin/src/components/quiz/QuizPlayer.tsx` - Receives questions/rounds as props
- `apps/admin/src/app/api/quizzes/[slug]/data/route.ts` - Returns hardcoded data

**Problem:**
- No abstraction between data source and components
- Components expect specific data shape
- When switching to DB, need to update every component
- No loading/error states
- No caching strategy

**Refactor:**
```typescript
// Create: apps/admin/src/services/quizService.ts
export class QuizService {
  async getQuizBySlug(slug: string): Promise<QuizData> {
    // Try cache first, then API, then mock
    const cached = getCachedQuiz(slug)
    if (cached) return cached
    
    try {
      const response = await fetch(`/api/quizzes/${slug}/data`)
      if (response.ok) {
        const data = await response.json()
        cacheQuiz(slug, data)
        return data
      }
    } catch (error) {
      // Fallback to mock in dev
      if (process.env.NODE_ENV === 'development') {
        return MOCK_QUIZ_DATA[slug]
      }
      throw error
    }
  }
}

// Create: apps/admin/src/hooks/useQuiz.ts
export function useQuiz(slug: string) {
  const [data, setData] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    QuizService.getQuizBySlug(slug)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [slug])
  
  return { data, loading, error }
}

// Update play page:
export default function QuizPlayPage() {
  const { slug } = useParams()
  const { data: quizData, loading, error } = useQuiz(slug)
  
  if (loading) return <QuizLoadingSkeleton />
  if (error) return <QuizError error={error} />
  if (!quizData) return <QuizNotFound />
  
  return <QuizPlayer quizSlug={slug} questions={quizData.questions} rounds={quizData.rounds} />
}
```

**Priority:** 🔴 **HIGH**

---

### 4. Achievement Logic Embedded in QuizPlayer

**File:** `apps/admin/src/components/quiz/QuizPlayer.tsx` (lines 528-619)

**Problem:**
- Achievement checking logic hardcoded in component
- Achievement definitions imported from `achievements.ts` but logic is inline
- No way to fetch achievements from API
- Achievement unlocking happens client-side only
- When adding DB, need to track achievements server-side

**Current Pattern:**
```typescript
// Lines 528-619: Achievement checking
useEffect(() => {
  // Hardcoded achievement checks
  if (quizSlug === "279" && correctAnswers.size === questions.length) {
    // Unlock achievement
  }
  if (timer > 0 && timer < 600 && currentIndex === questions.length - 1) {
    // Unlock speed demon
  }
}, [correctAnswers.size, revealedAnswers.size, currentIndex, timer])
```

**Refactor:**
```typescript
// Create: apps/admin/src/services/achievementService.ts
export class AchievementService {
  async checkAchievements(quizSlug: string, context: AchievementContext): Promise<Achievement[]> {
    // Fetch achievement definitions from API
    // Check conditions server-side
    // Return unlocked achievements
  }
  
  async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    // API call to unlock
  }
}

// Create: apps/admin/src/hooks/useAchievementChecker.ts
export function useAchievementChecker(quizSlug: string, context: AchievementContext) {
  const [unlocked, setUnlocked] = useState<Achievement[]>([])
  
  useEffect(() => {
    AchievementService.checkAchievements(quizSlug, context)
      .then(newAchievements => {
        setUnlocked(prev => [...prev, ...newAchievements])
        // Show notifications
      })
  }, [quizSlug, context])
  
  return unlocked
}

// Update QuizPlayer:
const achievements = useAchievementChecker(quizSlug, {
  correctAnswers: correctAnswers.size,
  totalQuestions: questions.length,
  timer,
  currentIndex,
  // ... other context
})
```

**Priority:** 🔴 **HIGH**

---

### 5. No Error Handling or Loading States

**Files:**
- `apps/admin/src/app/quizzes/[slug]/play/page.tsx` - No loading/error states
- `apps/admin/src/app/api/quizzes/[slug]/data/route.ts` - Basic error handling only
- `apps/admin/src/components/quiz/QuizPlayer.tsx` - Assumes data exists

**Problem:**
- Components crash if data is missing
- No loading skeletons
- No error boundaries for API failures
- When switching to DB, network errors will break app

**Current Pattern:**
```typescript
// play/page.tsx line 546
if (!quiz || !quizData) return null; // Silent failure
```

**Refactor:**
```typescript
// Add error boundary
<ErrorBoundary fallback={<QuizErrorFallback />}>
  <QuizPlayPage />
</ErrorBoundary>

// Add loading states
export default function QuizPlayPage() {
  const { slug } = useParams()
  const { data, loading, error } = useQuiz(slug)
  
  if (loading) return <QuizLoadingSkeleton />
  if (error) return <QuizError error={error} onRetry={() => refetch()} />
  if (!data) return <QuizNotFound slug={slug} />
  
  return <QuizPlayer {...data} />
}

// Add error handling in API route
export async function GET(...) {
  try {
    const quiz = await db.quiz.findUnique({ where: { slug } })
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }
    return NextResponse.json(quiz)
  } catch (error) {
    logger.error('Failed to fetch quiz', { slug, error })
    return NextResponse.json(
      { error: 'Failed to load quiz', code: 'QUIZ_FETCH_ERROR' },
      { status: 500 }
    )
  }
}
```

**Priority:** 🔴 **HIGH**

---

### 6. localStorage/sessionStorage for Critical State

**Files:**
- `apps/admin/src/components/quiz/QuizPlayer.tsx` - Lines 1132-1148 (completion), 546-553 (timer)
- `apps/admin/src/lib/storage.ts` - Auth state in localStorage

**Problem:**
- Quiz completion stored in localStorage (line 1141)
- Timer in sessionStorage (line 497)
- No server-side persistence
- Data lost on clear cache
- Can't sync across devices
- When adding DB, need to migrate all localStorage usage

**Current Pattern:**
```typescript
// Line 1136-1141
const completionData = { score, totalQuestions, completedAt: new Date().toISOString() }
localStorage.setItem(completionKey, JSON.stringify(completionData))
```

**Refactor:**
```typescript
// Create: apps/admin/src/services/quizSessionService.ts
export class QuizSessionService {
  async saveProgress(quizSlug: string, progress: QuizProgress): Promise<void> {
    // Save to database
    await fetch('/api/quiz/sessions', {
      method: 'POST',
      body: JSON.stringify({ quizSlug, progress })
    })
  }
  
  async getProgress(quizSlug: string): Promise<QuizProgress | null> {
    // Fetch from database
    const response = await fetch(`/api/quiz/sessions/${quizSlug}`)
    return response.ok ? response.json() : null
  }
  
  // Keep localStorage as optimistic cache only
  cacheProgress(quizSlug: string, progress: QuizProgress): void {
    localStorage.setItem(`quiz-${quizSlug}-cache`, JSON.stringify(progress))
  }
}

// Update QuizPlayer:
const saveProgress = useCallback(async () => {
  const progress = { currentIndex, correctAnswers, timer, ... }
  await QuizSessionService.saveProgress(quizSlug, progress)
  QuizSessionService.cacheProgress(quizSlug, progress) // Optimistic cache
}, [quizSlug, currentIndex, correctAnswers, timer])
```

**Priority:** 🔴 **HIGH**

---

## 🟡 MEDIUM PRIORITY - Important but Not Blocking

### 7. Quiz Builder: No Data Persistence Layer

**File:** `apps/admin/src/app/admin/quizzes/builder/page.tsx` (940+ lines)

**Problem:**
- Builder state in component (useState)
- Save function (line 148+) just calls API, no local persistence
- No draft saving
- No auto-save
- Data lost on refresh
- When adding DB, need draft system

**Current Pattern:**
```typescript
// Line 81-103: loadQuiz just sets state, no persistence
const loadQuiz = async (quizId: string) => {
  const response = await fetch(`/api/admin/quizzes/${quizId}`)
  // ... sets state
}
```

**Refactor:**
```typescript
// Create: apps/admin/src/hooks/useQuizBuilder.ts
export function useQuizBuilder(quizId?: string) {
  const [quiz, setQuiz] = useState<QuizBuilderData>(...)
  const [isDirty, setIsDirty] = useState(false)
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout>()
  
  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (isDirty && quiz.title) {
      const timer = setTimeout(() => {
        saveDraft(quiz)
      }, 30000)
      setAutoSaveTimer(timer)
      return () => clearTimeout(timer)
    }
  }, [quiz, isDirty])
  
  const saveDraft = async (data: QuizBuilderData) => {
    await fetch('/api/admin/quizzes/drafts', {
      method: 'POST',
      body: JSON.stringify({ quizId, data, type: 'draft' })
    })
  }
  
  return { quiz, setQuiz, saveDraft, isDirty, setIsDirty }
}
```

**Priority:** 🟡 **MEDIUM**

---

### 8. Inconsistent Data Fetching Patterns

**Files:**
- `apps/admin/src/app/admin/quizzes/[id]/page.tsx` - Uses `fetch` directly (line 121)
- `apps/admin/src/app/admin/achievements/page.tsx` - Uses `fetch` with fallback to hardcoded data (line 57-250)
- `apps/admin/src/app/admin/quizzes/builder/page.tsx` - Uses `fetch` for categories (line 122)

**Problem:**
- Some components fetch on mount, some receive props
- Some have error handling, some don't
- Some use loading states, some don't
- Inconsistent patterns make it hard to add DB layer uniformly

**Current Patterns:**
```typescript
// Pattern 1: Direct fetch in component
useEffect(() => {
  fetch('/api/admin/quizzes/${id}').then(...)
}, [id])

// Pattern 2: Fetch with hardcoded fallback
const response = await fetch('/api/admin/achievements')
if (response.ok) {
  setAchievements(data.achievements)
} else {
  setAchievements(exampleAchievements) // Hardcoded fallback
}

// Pattern 3: No fetch, hardcoded data
setCategories([{ id: 'cat-1', name: 'History' }, ...]) // Line 125
```

**Refactor:**
```typescript
// Create: apps/admin/src/hooks/useApiQuery.ts (generic data fetching hook)
export function useApiQuery<T>(endpoint: string, options?: { enabled?: boolean }) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    if (options?.enabled === false) return
    
    fetch(endpoint)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [endpoint, options?.enabled])
  
  return { data, loading, error, refetch: () => { /* ... */ } }
}

// Use consistently:
const { data: quiz, loading, error } = useApiQuery<QuizDetail>(`/api/admin/quizzes/${id}`)
const { data: achievements } = useApiQuery<Achievement[]>('/api/admin/achievements')
const { data: categories } = useApiQuery<Category[]>('/api/admin/categories')
```

**Priority:** 🟡 **MEDIUM**

---

### 9. Type Mismatches Between Dummy Data and Schema

**Files:**
- `apps/admin/src/app/quizzes/[slug]/play/page.tsx` - `QUIZ_DATA` uses `any[]` (line 26)
- `apps/admin/src/components/quiz/QuizPlayer.tsx` - Props expect `QuizQuestion[]` but receive different shape
- `packages/db/prisma/schema.prisma` - Has proper types

**Problem:**
- Dummy data shape doesn't match Prisma schema
- Components use loose types (`any`)
- When switching to DB, type errors will surface
- No type safety during development

**Current Pattern:**
```typescript
// play/page.tsx line 26
const QUIZ_DATA: Record<string, { questions: any[]; rounds: any[] }> = {
  // questions have: id, roundNumber, question, answer
  // But Prisma schema has: id, text, answer, categoryId, ...
}

// QuizPlayer expects:
interface QuizQuestion {
  id: number  // But DB uses string (cuid)
  roundNumber: number
  question: string  // But component expects 'question' field
  answer: string
}
```

**Refactor:**
```typescript
// Create: apps/admin/src/types/quiz.ts (matching Prisma schema)
export interface QuizQuestion {
  id: string  // cuid from Prisma
  text: string  // matches schema
  answer: string
  explanation?: string | null
  roundNumber: number  // computed from Round relation
  // ... other fields from schema
}

// Create: apps/admin/src/lib/transformers/quizTransformer.ts
export function transformPrismaQuizToPlayFormat(prismaQuiz: PrismaQuiz): PlayQuizData {
  return {
    questions: prismaQuiz.rounds.flatMap(round =>
      round.questions.map(q => ({
        id: parseInt(q.id) || q.id,  // Transform if needed
        roundNumber: round.index,
        question: q.text,  // Map 'text' to 'question'
        answer: q.answer,
        // ...
      }))
    ),
    rounds: prismaQuiz.rounds.map(r => ({
      number: r.index,
      title: r.category.name,
      // ...
    }))
  }
}

// Use in API route:
const prismaQuiz = await db.quiz.findUnique({ where: { slug }, include: { rounds: { include: { questions: true } } } })
const playData = transformPrismaQuizToPlayFormat(prismaQuiz)
return NextResponse.json(playData)
```

**Priority:** 🟡 **MEDIUM**

---

### 10. Quiz Constants Duplicated

**Files:**
- `apps/admin/src/components/quiz/QuizPlayer.tsx` - Lines 24-29
- `apps/web/src/components/quiz/QuizPlayer.tsx` - Lines 19-24
- `apps/admin/src/app/create-quiz/page.tsx` - Lines 93-98
- `apps/admin/src/app/admin/quizzes/builder/page.tsx` - Lines 37-39

**Problem:**
- Same constants (4 rounds, 6 questions, 1 finale) in 4+ files
- Changes require updates everywhere
- Risk of inconsistencies

**Refactor:**
```typescript
// Create: packages/db/src/constants.ts
export const QUIZ_CONSTANTS = {
  STANDARD_ROUND_COUNT: 4,
  QUESTIONS_PER_STANDARD_ROUND: 6,
  FINALE_ROUND_NUMBER: 5,
  FINALE_QUESTION_COUNT: 1,
  TOTAL_QUESTIONS: 4 * 6 + 1, // 25
} as const

// Import everywhere:
import { QUIZ_CONSTANTS } from '@schoolquiz/db/constants'
const { STANDARD_ROUND_COUNT, QUESTIONS_PER_STANDARD_ROUND } = QUIZ_CONSTANTS
```

**Priority:** 🟡 **MEDIUM**

---

### 11. No Validation Layer

**Files:**
- `apps/admin/src/app/api/admin/quizzes/builder/route.ts` - Basic validation (lines 26-68)
- `apps/admin/src/components/quiz/QuizPlayer.tsx` - No validation of quiz structure

**Problem:**
- Validation logic scattered
- No shared validation utilities
- When adding DB, need consistent validation
- Risk of invalid data reaching components

**Refactor:**
```typescript
// Create: apps/admin/src/lib/validation/quizValidation.ts
import { z } from 'zod'

export const QuizSchema = z.object({
  title: z.string().min(1).max(200),
  rounds: z.array(RoundSchema).length(5),
  // ...
})

export const RoundSchema = z.object({
  title: z.string().min(1),
  categoryId: z.string(),
  questions: z.array(QuestionSchema),
  isPeoplesRound: z.boolean(),
}).refine(
  (round) => round.isPeoplesRound ? round.questions.length === 1 : round.questions.length === 6,
  { message: "Standard rounds must have 6 questions, people's round must have 1" }
)

// Use in API route:
export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = QuizSchema.safeParse(body)
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.errors },
      { status: 400 }
    )
  }
  
  // Proceed with validated data
}
```

**Priority:** 🟡 **MEDIUM**

---

### 12. Achievement Data Hardcoded in Component

**File:** `apps/admin/src/app/admin/achievements/page.tsx` (lines 67-247)

**Problem:**
- Example achievements hardcoded in component (200+ lines)
- Fallback logic mixed with data fetching
- When API fails, shows hardcoded data (confusing)

**Current Pattern:**
```typescript
// Lines 66-174: Hardcoded achievements as fallback
if (apiAchievements.length === 0) {
  const exampleAchievements: Achievement[] = [
    { id: 'example-1', ... },  // 100+ lines of hardcoded data
  ]
  setAchievements(exampleAchievements)
}
```

**Refactor:**
```typescript
// Move to: apps/admin/src/lib/mock/achievement-fixtures.ts
export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'example-1', ... },
  // ...
]

// Update component:
const { data: achievements, loading, error } = useApiQuery<Achievement[]>('/api/admin/achievements', {
  fallback: process.env.NODE_ENV === 'development' ? MOCK_ACHIEVEMENTS : []
})
```

**Priority:** 🟡 **MEDIUM**

---

## 🟢 LOW PRIORITY - Nice to Have

### 13. URL Structure Inconsistencies

**Files:**
- `apps/admin/src/app/quizzes/[slug]/play/page.tsx` - Uses `slug`
- `apps/admin/src/app/admin/quizzes/[id]/page.tsx` - Uses `id`
- `apps/admin/src/app/api/quizzes/[slug]/data/route.ts` - Uses `slug`

**Problem:**
- Mix of `slug` and `id` in URLs
- When adding DB, need to decide on URL strategy
- Could cause confusion

**Refactor:**
- Standardize on `slug` for public routes, `id` for admin routes
- Or use `id` everywhere and add slug lookup

**Priority:** 🟢 **LOW**

---

### 14. No Request Caching/Deduplication

**Problem:**
- Multiple components might fetch same data
- No request deduplication
- When adding DB, unnecessary load

**Refactor:**
```typescript
// Add React Query or SWR for caching/deduplication
import { useQuery } from '@tanstack/react-query'

const { data: quiz } = useQuery({
  queryKey: ['quiz', slug],
  queryFn: () => QuizService.getQuizBySlug(slug),
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

**Priority:** 🟢 **LOW**

---

### 15. Achievement Definitions Duplicated

**Files:**
- `apps/admin/src/components/quiz/achievements.ts`
- `apps/web/src/components/quiz/achievements.ts`

**Problem:**
- Same definitions in two places
- Need to keep in sync manually

**Refactor:**
- Move to shared package: `packages/db/src/achievements.ts`
- Import in both apps

**Priority:** 🟢 **LOW**

---

## Summary of Recommended Refactors

### Immediate (Before DB Integration):

1. **Extract data fixtures** → `lib/mock/quiz-fixtures.ts`
2. **Create data access layer** → `services/quizService.ts` + `hooks/useQuiz.ts`
3. **Extract QuizPlayer hooks** → `hooks/useQuizPlay.ts`, `useQuizTimer.ts`, `useQuizAchievements.ts`
4. **Add error boundaries and loading states** → All data-fetching components
5. **Create quiz session service** → Replace localStorage with API calls

### Before Production:

6. **Standardize data fetching** → `hooks/useApiQuery.ts`
7. **Add validation layer** → `lib/validation/quizValidation.ts` (Zod)
8. **Fix type mismatches** → Create transformers between Prisma and component types
9. **Extract constants** → `packages/db/src/constants.ts`
10. **Add request caching** → React Query or SWR

### Nice to Have:

11. Standardize URL structure
12. Consolidate achievement definitions
13. Add auto-save to quiz builder

---

## Migration Strategy

1. **Phase 1:** Extract data layer (services + hooks) - keeps working with mocks
2. **Phase 2:** Add DB queries behind services - can switch via feature flag
3. **Phase 3:** Remove mocks, use DB only
4. **Phase 4:** Optimize (caching, pagination, etc.)

This approach allows incremental migration without breaking existing functionality.

