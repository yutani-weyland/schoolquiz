# Codebase Snapshot - SchoolQuiz v1

**Generated:** 2025-01-XX  
**Purpose:** Inventory of current state, dummy data locations, and tech debt before database integration

---

## Architecture

### Monorepo Structure
- **Monorepo:** pnpm workspaces + Turborepo
- **Apps:**
  - `apps/admin/` - Next.js 14 App Router (admin dashboard)
  - `apps/web/` - Astro + React islands (public-facing quiz app)
- **Packages:**
  - `packages/db/` - Prisma schema + Supabase client
  - `packages/ui/` - Shared UI components + motion utilities
  - `packages/auth/`, `packages/api/`, `packages/analytics/` - Shared utilities

### Pages/Routes

#### Admin App (`apps/admin/src/app/`)
**Public Routes:**
- `/` - Landing page
- `/quizzes` - Quiz grid (uses dummy data)
- `/quizzes/[slug]/intro` - Quiz intro page
- `/quizzes/[slug]/play` - Quiz player (presenter/grid modes)
- `/sign-in`, `/sign-up` - Auth pages
- `/premium`, `/upgrade` - Premium subscription pages
- `/demo` - Demo quiz for visitors

**Admin Routes (`/admin/*`):**
- `/admin` - Dashboard (overview)
- `/admin/quizzes` - Quiz list
- `/admin/quizzes/[id]` - Quiz detail/edit
- `/admin/quizzes/builder` - Quiz builder (4×6 + finale)
- `/admin/categories` - Category library
- `/admin/questions` - Question bank
- `/admin/questions/submissions` - User question submissions
- `/admin/analytics/*` - Analytics (engagement, funnel, learning)
- `/admin/billing/*` - Billing & subscriptions
- `/admin/organisations/*` - Org management
- `/admin/users/*` - User management
- `/admin/scheduling` - Scheduled jobs
- `/admin/system/*` - Feature flags, audit logs
- `/admin/support` - Support tickets
- `/admin/achievements` - Achievement management

**API Routes (`/api/*`):**
- `/api/admin/*` - Admin-only endpoints (all use dummy data)
- `/api/quizzes/[slug]/data` - Quiz questions/rounds (hardcoded)
- `/api/quizzes/[slug]/pdf` - PDF generation
- `/api/user/*` - User profile, subscription
- `/api/achievements` - User achievements
- `/api/stats` - User statistics
- `/api/leaderboards/*` - Leaderboard management
- `/api/private-leagues/*` - Private league management

#### Web App (`apps/web/src/pages/`)
- `/` - Landing page (Astro)
- `/quizzes` - Quiz grid (Astro)
- `/quiz/[slug]` - Quiz intro (Astro)
- `/quiz/[slug]/play` - Quiz player (React island)
- `/sign-in`, `/sign-up` - Auth (Astro)
- `/premium`, `/upgrade` - Premium pages
- `/about`, `/help` - Content pages

### Layout Structure

**Admin App:**
- `apps/admin/src/app/layout.tsx` - Root layout with `UserAccessProvider`, `ThemeProvider`
- `apps/admin/src/app/admin/layout.tsx` - Admin layout wrapper
- `apps/admin/src/app/(admin)/layout.tsx` - Admin section layout

**Web App:**
- `apps/web/src/layouts/Layout.astro` - Root Astro layout with theme handling

### Key Providers

**`apps/admin/src/contexts/UserAccessContext.tsx`**
- Manages user tier: `visitor` | `free` | `premium`
- Reads from `localStorage` (authToken, userId, userTier)
- Fetches subscription status from `/api/user/subscription`
- Exposes: `tier`, `isVisitor`, `isFree`, `isPremium`, `isLoggedIn`, `userId`, `userName`, `userEmail`

**`apps/admin/src/contexts/ThemeContext.tsx`**
- Manages theme state (light/dark/colored)
- Syncs with cookies and localStorage

### Major Components

**Quiz Play Experience:**
- `apps/admin/src/components/quiz/QuizPlayer.tsx` - Main quiz player (presenter + grid modes)
- `apps/admin/src/components/quiz/play/QuestionArea.tsx` - Question display
- `apps/admin/src/components/quiz/play/MobileGridLayout.tsx` - Grid view for mobile
- `apps/admin/src/components/quiz/play/QuestionProgressBar.tsx` - Progress indicator
- `apps/admin/src/components/quiz/play/QuizHeader.tsx` - Header with controls
- `apps/admin/src/components/quiz/play/QuizStatusBar.tsx` - Score/timer display
- `apps/web/src/components/quiz/QuizPlayer.tsx` - Web app version (similar)

**Quiz Builder:**
- `apps/admin/src/app/admin/quizzes/builder/page.tsx` - Quiz builder UI
- `apps/admin/src/app/create-quiz/page.tsx` - Alternative builder (legacy?)

**Quiz Cards/Grid:**
- `apps/admin/src/components/quiz/QuizCard.tsx` - Quiz card component
- `apps/admin/src/components/quiz/QuizzesGrid.tsx` - Grid layout
- `apps/web/src/components/QuizCard.astro` - Astro version

**Achievements:**
- `apps/admin/src/components/quiz/AchievementNotification.tsx` - Achievement popup
- `apps/admin/src/components/quiz/achievements.ts` - Achievement definitions (hardcoded)

**Admin Components:**
- `apps/admin/src/components/admin/*` - Admin-specific components (32 files)
- `apps/admin/src/components/dashboard/*` - Dashboard widgets
- `apps/admin/src/components/stats/*` - Statistics displays

---

## Key Features That Work

### Quiz Play Experience
✅ **Presenter Mode** - Full-screen question display with keyboard shortcuts
- Arrow keys for navigation
- Space to reveal answers
- Timer toggle
- Score tracking
- Round intro screens

✅ **Grid Mode** - Mobile-friendly scrollable grid
- All questions visible
- Round headers
- Answer reveal per question
- Score counter

✅ **Quiz Format** - 4 rounds × 6 questions + 1 peoples round = 25 questions total
- Format enforced in `useQuizState.ts` and quiz constants
- Round navigation logic updated

✅ **Achievements** - In-game achievement system
- Achievement definitions in `achievements.ts`
- Achievement notifications during quiz play
- Progress tracking (hardcoded logic)

✅ **Theme System** - Light/dark/colored themes
- Theme persistence via cookies
- Accessibility controls (font, text size, motion)

### Admin Screens
✅ **Quiz Management** - List, view, edit quizzes (UI only, no persistence)
✅ **Quiz Builder** - Drag-and-drop quiz creation (4×6 + finale)
✅ **Category Library** - Category management UI
✅ **Question Bank** - Question list/filter UI
✅ **Analytics Dashboards** - Engagement, funnel, learning analytics (dummy data)
✅ **Billing Management** - Subscription list, invoices (dummy data)
✅ **User Management** - User list, role management (dummy data)
✅ **Organisation Management** - Org list, member management (dummy data)

### Authentication & Access Control
✅ **User Tiers** - Visitor/Free/Premium distinction
✅ **Auth Flow** - Sign-in/sign-up pages
✅ **Access Gating** - Premium features gated by tier
- Free users limited to latest quiz
- Premium users get full access

---

## Where Dummy Data Lives

### Primary Dummy Data Files

**`apps/admin/src/lib/dummy-quiz-data.ts`**
- `dummyQuizzes` - Array of quiz metadata (5 quizzes)
- `dummyRuns` - Quiz run/session data
- `dummyScheduledJobs` - Scheduled job data
- `getDummyQuizDetail(id)` - Returns quiz with rounds and questions (4×6 + finale format)

**`apps/admin/src/lib/dummy-analytics-data.ts`**
- `dummyEngagementData` - DAU/MAU, quiz attempts, top orgs
- `dummyFunnelData` - Conversion funnel metrics
- `dummyLearningData` - Learning outcome coverage, difficulty stats

**`apps/admin/src/lib/dummy-billing-data.ts`**
- `dummyBillingData` - Subscriptions, invoices, offer codes, webhooks

**`apps/admin/src/lib/dummy-data.ts`**
- Additional dummy data (users, orgs, etc.)

### Hardcoded Quiz Content

**`apps/admin/src/app/quizzes/[slug]/play/page.tsx`**
- `QUIZ_DATA` - Massive object with questions/rounds for slugs: "12", "279", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"
- Each quiz has 25 questions (4 rounds × 6 + 1 finale)
- Also has `DATA` array with quiz metadata

**`apps/admin/src/app/api/quizzes/[slug]/data/route.ts`**
- Duplicate `QUIZ_DATA` object (same structure as play page)
- Returns quiz questions/rounds for given slug

**`apps/admin/src/app/demo/page.tsx`**
- `QUIZ_QUESTIONS` - Hardcoded 25 questions for demo
- `QUIZ_ROUNDS` - Hardcoded 5 rounds

**`apps/admin/src/app/quizzes/[slug]/intro/page.tsx`**
- `DATA` - Array of quiz metadata (12 quizzes)

**`apps/admin/src/app/quizzes/page.tsx`**
- `quizzes` - Array of quiz metadata (12 quizzes)

**`apps/web/src/pages/quizzes.astro`**
- `quizzes` - Array of quiz metadata (hardcoded in Astro file)

### Achievement Data

**`apps/admin/src/components/quiz/achievements.ts`**
- `ACHIEVEMENT_DEFINITIONS` - Array of achievement definitions
- `ACHIEVEMENT_MAP` - Keyed achievement map
- Achievement artwork paths: `/achievements/hail-caesar.png`, etc.

**`apps/web/src/components/quiz/achievements.ts`**
- Similar achievement definitions (duplicated)

### API Route Patterns

**All `/api/admin/*` routes use dummy data:**
- `apps/admin/src/app/api/admin/quizzes/route.ts` - Uses `dummyQuizzes`
- `apps/admin/src/app/api/admin/quizzes/[id]/route.ts` - Uses `getDummyQuizDetail()`
- `apps/admin/src/app/api/admin/analytics/*/route.ts` - Uses `dummyAnalyticsData`
- `apps/admin/src/app/api/admin/billing/*/route.ts` - Uses `dummyBillingData`
- `apps/admin/src/app/api/admin/users/route.ts` - Uses dummy user data
- `apps/admin/src/app/api/admin/organisations/route.ts` - Uses dummy org data

**Pattern:** Most routes have `// TODO: Switch to database when ready` comments

### LocalStorage/SessionStorage Usage

**`apps/admin/src/lib/storage.ts`**
- `authToken`, `userId`, `userName`, `userEmail`, `userTier` stored in localStorage
- `quiz-${slug}-timer` stored in sessionStorage
- `quiz-${slug}-completion` stored in localStorage

**`apps/admin/src/lib/quiz-color-store.ts`**
- Quiz color overrides stored in localStorage (temporary workaround)

### In-Component Data

**Quiz constants:**
- `apps/admin/src/components/quiz/QuizPlayer.tsx` - `STANDARD_ROUND_COUNT = 4`, `QUESTIONS_PER_STANDARD_ROUND = 6`, `FINALE_QUESTION_COUNT = 1`
- `apps/web/src/components/quiz/QuizPlayer.tsx` - Same constants

**Color generation:**
- `apps/admin/src/lib/colors.ts` - `getQuizColor(n)` function generates colors deterministically

---

## Obvious Tech Debt or Smells

### Data Duplication

1. **Quiz Data Duplicated in Multiple Files**
   - `QUIZ_DATA` exists in both `apps/admin/src/app/quizzes/[slug]/play/page.tsx` and `apps/admin/src/app/api/quizzes/[slug]/data/route.ts`
   - Quiz metadata arrays duplicated across: `play/page.tsx`, `intro/page.tsx`, `quizzes/page.tsx`, `quizzes.astro`
   - **Impact:** Changes require updates in multiple places

2. **Achievement Definitions Duplicated**
   - `apps/admin/src/components/quiz/achievements.ts` and `apps/web/src/components/quiz/achievements.ts` have similar definitions
   - **Impact:** Achievement changes need to be synced manually

3. **Quiz Constants Duplicated**
   - Round/question counts defined in both admin and web QuizPlayer components
   - **Impact:** Format changes require updates in multiple files

### Authentication & State Management

4. **Auth State in localStorage**
   - `UserAccessContext` reads from localStorage (`authToken`, `userId`, `userTier`)
   - No server-side session validation
   - **Impact:** Easy to bypass, no real security

5. **Tier Determination Logic Scattered**
   - Tier logic in `UserAccessContext`, `storage.ts`, and various components
   - **Impact:** Hard to maintain consistent access control

6. **No Real Session Management**
   - Auth tokens stored client-side only
   - No refresh token mechanism
   - **Impact:** Security risk, no proper session invalidation

### API Route Patterns

7. **All Admin Routes Use Dummy Data**
   - 48+ API routes have `// TODO: Switch to database when ready` comments
   - Pattern: Import dummy data, return it as JSON
   - **Impact:** Massive migration effort when adding database

8. **No Error Handling for Missing Data**
   - Routes assume dummy data exists
   - No validation of data structure
   - **Impact:** Will break when switching to database if structure differs

9. **Auth Checks Commented Out**
   - Most routes have `// Skip auth for testing` comments
   - `getCurrentUser()` calls are commented out
   - **Impact:** No real authorization, security risk

### Database Schema vs. Dummy Data Mismatch

10. **Schema Exists But Unused**
   - `packages/db/prisma/schema.prisma` has full schema defined
   - `supabase/migrations/` has SQL migrations
   - But all code uses dummy data instead
   - **Impact:** Schema may not match actual data needs

11. **Type Mismatches**
   - Dummy data uses simple objects
   - Prisma schema has relations, enums, etc.
   - **Impact:** Type errors when switching to database

### Component Architecture

12. **Large Component Files**
   - `QuizPlayer.tsx` is 1800+ lines (admin) and 1100+ lines (web)
   - `create-quiz/page.tsx` is 1400+ lines
   - **Impact:** Hard to maintain, test, and refactor

13. **Props Drilling**
   - Quiz data passed through multiple component layers
   - State management scattered (useState, localStorage, sessionStorage)
   - **Impact:** Hard to track data flow, potential bugs

14. **Mixed Data Sources**
   - Some components read from props, others from localStorage, others from API
   - **Impact:** Unpredictable behavior, hard to debug

### State Management

15. **No Centralized State**
   - Quiz state in `useQuizState.ts` (round/question navigation)
   - User state in `UserAccessContext`
   - Quiz data from props/API
   - Timer in sessionStorage
   - **Impact:** State can get out of sync

16. **SessionStorage for Quiz Progress**
   - Quiz progress stored in sessionStorage
   - Timer stored separately
   - **Impact:** Progress lost on tab close, no persistence

### Type Safety

17. **Loose Types in Dummy Data**
   - `QUIZ_DATA` uses `any[]` for questions/rounds
   - Many API responses use `any`
   - **Impact:** Type errors when switching to typed database queries

18. **Missing Type Definitions**
   - Quiz/question types defined in multiple places
   - Some components use inline types
   - **Impact:** Type inconsistencies

### Testing & Validation

19. **No Data Validation**
   - Dummy data assumed to be correct
   - No validation of quiz structure (4×6 + finale)
   - **Impact:** Invalid data could break UI

20. **Hardcoded Business Logic**
   - Quiz format (4×6 + finale) hardcoded in multiple places
   - Achievement logic hardcoded in components
   - **Impact:** Changes require code updates, not config

### Performance

21. **Large Dummy Data Objects**
   - `QUIZ_DATA` object is 500+ lines
   - Loaded on every page that needs it
   - **Impact:** Unnecessary bundle size, slower initial load

22. **No Data Pagination**
   - All dummy data loaded at once
   - Quiz lists show all quizzes
   - **Impact:** Will need pagination when switching to database

### File Organization

23. **Dummy Data Files Scattered**
   - `dummy-quiz-data.ts`, `dummy-analytics-data.ts`, `dummy-billing-data.ts` in `lib/`
   - But also hardcoded in component files
   - **Impact:** Hard to find all dummy data locations

24. **API Routes Not Organized by Feature**
   - All routes in flat `/api/admin/*` structure
   - Some routes have similar patterns but different implementations
   - **Impact:** Hard to maintain consistency

---

## Summary

**Current State:** Functional UI/UX prototype with comprehensive admin dashboard and quiz play experience. All data is hardcoded/dummy data.

**Database Readiness:** Low. While Prisma schema exists, all application code uses dummy data. Migration will require:
- Replacing 48+ API routes
- Updating all components that read dummy data
- Implementing proper auth/session management
- Adding data validation
- Handling type mismatches
- Refactoring large components

**Biggest Risks:**
1. Data duplication across files
2. No real authentication/authorization
3. Large component files that will be hard to refactor
4. Type mismatches between dummy data and schema
5. Scattered state management

**Recommended Next Steps:**
1. Consolidate dummy data into single source of truth
2. Create data access layer (repository pattern) to abstract dummy vs. real data
3. Implement proper auth with Supabase
4. Start migrating one feature at a time (e.g., quiz list first)
5. Add type definitions that match Prisma schema
6. Break down large components before database migration

