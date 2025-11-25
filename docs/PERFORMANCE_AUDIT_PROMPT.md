# Front-End Performance & Loading UX Audit Prompt
## SchoolQuiz Production App - Next.js App Router

You are an expert front-end engineer specialising in React, Next.js App Router, and performance-focused UX (streaming, Suspense, lazy loading, skeletons, optimistic UIs).

You are working on **SchoolQuiz**, a production quiz platform for Australian high schools. Your job is to audit and optimize how content loads on every customer-facing screen.

**Project Context:**
- **Framework:** Next.js 14+ with App Router (`apps/admin/src/app/`)
- **UI System:** shadcn/ui components + custom components
- **Existing Loading Components:** `Skeleton`, `SkeletonCard`, `SkeletonText` (in `apps/admin/src/components/ui/Skeleton.tsx`), `LoadingSpinner`, `QuizLoadingSkeleton`
- **Current State:** Mix of Server Components (some admin pages) and Client Components (most customer-facing pages)
- **Data Layer:** Postgres via Supabase, Prisma ORM
- **Key Routes:** Landing (`/`), Quizzes (`/quizzes`), Quiz Player (`/quizzes/[slug]/play`), Dashboard (`/dashboard`), Account (`/account`), Achievements, Leaderboards, etc.

When you work, follow the phases below and **ALWAYS reason from the existing codebase** before proposing changes.

---

## PHASE 0 – Discovery

### 1. **Identify all customer-facing routes/pages**

Inspect the routing layer in `apps/admin/src/app/`:

- Look for `page.tsx` files in:
  - Public routes (no auth required): `/`, `/quizzes`, `/quizzes/[slug]/intro`, `/quizzes/[slug]/play`, `/demo`, `/about`, `/pricing`, `/sign-in`, `/sign-up`
  - Authenticated routes: `/dashboard`, `/account`, `/achievements`, `/stats`, `/leaderboards`, `/leagues`, `/premium/*`, `/custom-quizzes/*`
  - Exclude `/admin/*` routes (internal admin only, unless they're also customer-facing)

- Build a table listing:
  - Route path
  - Main React component file
  - Purpose (marketing / quiz player / dashboard / account management)
  - Auth requirement (public / authenticated / premium-only)

### 2. **Trace data + loading flow for each page**

For each customer-facing page:

- **Identify where data is fetched:**
  - Server Components: `async function Page()` with direct DB queries or `fetch()` calls
  - Client Components: `useEffect` + `fetch()`, `useSWR`, `react-query`, or custom hooks (`useQuiz`, `useUserTier`, etc.)
  - Route handlers: `/api/*` endpoints called from client
  - Check existing files like `apps/admin/src/hooks/useQuiz.ts`, `apps/admin/src/services/quizService.ts`

- **Identify:**
  - What renders **above the fold** (hero, title, key actions, navigation)
  - What is **blockingly waited on** before first paint (e.g., auth check, quiz data, user stats)
  - Which components depend on **heavier data** (quiz lists, leaderboards, charts, achievement galleries, PDF generation)

- **Check for existing loading patterns:**
  - Look for `loading.tsx` files in route segments
  - Check for `Suspense` boundaries in Server Components
  - Look for skeleton components (`Skeleton`, `SkeletonCard`, `QuizLoadingSkeleton`)
  - Check for client-side loading states (`isLoading`, `loading` props)

### 3. **Classify each page's current loading UX**

For each page, decide:

- Does it **stream content** (RSC + Suspense boundaries, `loading.tsx`) or **block** until everything is ready?
- Is any content **lazy-loaded** (`next/dynamic`, `React.lazy`)?
- What is shown while loading:
  - Blank screen?
  - Global spinner (`LoadingSpinner`)?
  - Skeletons (`Skeleton`, `SkeletonCard`)?
  - Loading bar / progress indicator?
  - Inline spinners?

- Capture this in a concise per-page summary.

**Output at the end of PHASE 0:**

A Markdown summary (`docs/PERFORMANCE_AUDIT_PHASE0.md`) with:
- Table of routes and purposes
- For each page: bullets describing current load order, loading UX, and techniques used (or missing)
- Reference existing components where applicable (e.g., "Uses `SkeletonCard` for quiz grid")

---

## PHASE 1 – UX & Technique Review

Using the PHASE 0 summary, review each page along these dimensions:

### 1. **Load order / perceived performance**

- Is there **something meaningful** on screen quickly (title, shell, nav, basic scaffolding)?
- Are heavy sections (quiz grids, leaderboards, charts, achievement galleries) **deferred** or does the entire page block on them?
- Could data fetching be **performed in parallel** instead of sequentially? (e.g., `Promise.all`, multiple concurrent RSC fetches)
- Check for **waterfall requests** (one fetch waits for another unnecessarily)

### 2. **Modern patterns & best practice**

Check whether the page uses:

- **Streaming / Suspense**
  - RSC with nested `Suspense` boundaries (see `apps/admin/src/app/admin/page.tsx` for example)
  - `loading.tsx` files for route segments (only `apps/admin/src/app/admin/loading.tsx` exists currently)
  - Server Components for initial data fetch

- **Lazy loading**
  - `next/dynamic` or `React.lazy` for:
    - Heavy components (charts - see `apps/admin/src/components/charts-lazy.tsx` for example)
    - Rarely visited UI (modals, admin panels, settings)
  - Check if chart libraries (recharts, @nivo) are code-split

- **Incremental / progressive rendering**
  - Rendering the shell + skeletal UI first, then filling in data
  - Breaking large lists into virtualised or paginated components
  - Progressive enhancement (show basic content, enhance with JS)

### 3. **Loading feedback & skeletons**

For each `page` and key child components:

- If data can take noticeable time:
  - **Skeletons** for:
    - Quiz cards (use existing `SkeletonCard`)
    - List items (tables, leaderboards)
    - Headings + metadata
    - Buttons and primary actions
  - **Loading bars or inline spinners** for:
    - Data tables
    - Async filters/sorting
    - Export/PDF generation actions
    - Quiz completion submission

- Ensure there is **never a dead, static area** while something important is loading.

- **Check consistency:**
  - Are skeletons using the existing `Skeleton` components from `apps/admin/src/components/ui/Skeleton.tsx`?
  - Or are there ad-hoc loading states that should be consolidated?

### 4. **Accessibility and consistency**

- Check that loading states:
  - Use consistent components (shared `Skeleton` / `LoadingSpinner` / `Spinner`)
  - Have appropriate ARIA attributes (`aria-busy`, `role="status"`, `aria-live`)
- Confirm that the visual design matches the app's design system (spacing, typography, colors from Tailwind config)

**Output at the end of PHASE 1:**

A Markdown document (`docs/PERFORMANCE_AUDIT_PHASE1.md`) with:
- Per page:
  - "Current state" (from PHASE 0)
  - "Issues / risks" (blocking loads, missing skeletons, waterfall requests, etc.)
  - "Recommended changes" (bullet points ordered by impact: High / Medium / Low)

---

## PHASE 2 – Implementation Plan

Design a concrete implementation plan that you will then apply to the codebase.

### 1. **Define shared primitives**

- **Propose or locate central components:**
  - `<Skeleton />` variants (already exists - check if it needs variants for text, avatar, card, table row)
  - `<PageShell />` / `<PageHeader />` wrappers (check if `SiteHeader` can be reused)
  - `<LoadingBar />` for long-running operations (PDF generation, large data exports)
  - `<Spinner />` for inline loading (check `apps/admin/src/components/ui/spinner.tsx`)

- **If similar ad-hoc skeletons/spinners already exist:**
  - Consolidate them into a consistent set instead of duplicating
  - Document the variants in a Storybook or component doc

### 2. **Per-page improvement plan**

For each customer-facing page:

- **Specify:**
  - Which sections should render immediately as part of the **shell** (nav via `SiteHeader`, title, key actions)
  - Which components should be:
    - Wrapped in `Suspense` with skeleton fallbacks
    - Lazy-loaded with `next/dynamic` / `React.lazy`
    - Fetched in parallel rather than sequentially

- **Explicitly call out:**
  - Heavy data tables (quiz lists, leaderboards) that should:
    - Show a skeleton table or row placeholders
    - Display a loading bar or inline loader for slow filters/sorts
  - Charts/visualisations that should lazy-load below the fold
  - Quiz player pages that should show `QuizLoadingSkeleton` immediately
  - Achievement galleries that should progressively load

- **Migration strategy:**
  - Which pages can be converted from Client Components to Server Components?
  - Which pages need to stay as Client Components (interactivity, real-time updates)?
  - How to handle auth checks (NextAuth session) in Server Components?

### 3. **Guardrails**

- Do NOT change business logic or data shape, only **how** and **when** it loads and how the user sees it
- Preserve API contracts and existing functionality
- Respect existing auth patterns (NextAuth + legacy localStorage fallback)
- If something is ambiguous, leave a `// TODO:` comment instead of guessing business behaviour
- **Preserve the Achievement Creator feature** (mentioned in repo rules - do not break it)

**Output at the end of PHASE 2:**

A Markdown plan (`docs/PERFORMANCE_AUDIT_PHASE2.md`) describing exactly what code changes you will make, grouped by:
- Shared primitives / design system updates
- Per-page modifications (with file paths)
- Migration order (which pages to tackle first)

---

## PHASE 3 – Code Changes

Now implement the plan from PHASE 2 across the codebase. Work incrementally and keep diffs focused.

### 3.1 Introduce / refine shared loading components

1. **If the project already has common loading components:**
   - Refactor them to be flexible enough (props for size, shape, layout)
   - Use them consistently instead of bespoke loaders
   - Check `apps/admin/src/components/ui/Skeleton.tsx` and enhance if needed

2. **If not, create a small set:**
   - `components/ui/Skeleton.tsx` (enhance existing)
   - `components/ui/LoadingBar.tsx` (new, for long operations)
   - `components/ui/Spinner.tsx` (check if `spinner.tsx` exists, enhance)

3. **Ensure they:**
   - Are lightweight, no heavy dependencies
   - Match the design system (border radius, spacing from Tailwind config)
   - Can be reused for cards, list items, headers, and table rows
   - Support dark mode (check existing theme implementation)

### 3.2 Add streaming / Suspense boundaries

For each relevant page:

1. **For RSC / Next.js App Router:**
   - Introduce nested `Suspense` boundaries around:
     - Main content that waits on non-critical data
     - Heavy subtrees like quiz grids, stats blocks, or charts
   - Use appropriate skeleton components as `fallback`
   - Reference `apps/admin/src/app/admin/page.tsx` as an example pattern

2. **For `loading.tsx` in route segments:**
   - Create or refine `loading.tsx` files so the route has a **nice skeleton state** instead of a blank background
   - Ensure the loading view visually resembles the final layout
   - Check `apps/admin/src/app/admin/loading.tsx` for reference

3. **For client components:**
   - Use `next/dynamic` / `React.lazy` for heavy, non-critical UI
     (e.g., charts - see `apps/admin/src/components/charts-lazy.tsx`, rich editors, complex modals)
   - Show a small inline skeleton or spinner while these load

### 3.3 Parallelise and optimise data fetching

In server components, data loaders, or page-level data functions:

1. **Identify sequential awaits like:**
   ```ts
   const a = await fetchA();
   const b = await fetchB();
   ```
   Replace with:
   ```ts
   const [a, b] = await Promise.all([fetchA(), fetchB()]);
   ```

2. **For Server Components:**
   - Use React `cache()` to deduplicate requests
   - Use `unstable_cache` for expensive queries with appropriate revalidation
   - Stream heavy sections with `Suspense`

3. **For Client Components:**
   - Batch API calls where possible (e.g., batch quiz completions - see `apps/admin/src/app/quizzes/page.tsx` line 228)
   - Use `Promise.all` for parallel fetches
   - Implement optimistic updates for mutations

### 3.4 Add skeletons and loading states

1. **For each page that fetches data:**
   - Add skeleton states that match the final layout
   - Use existing `SkeletonCard` for quiz grids
   - Use `Skeleton` for text/headings
   - Create table row skeletons for data tables

2. **For interactive elements:**
   - Show inline spinners for button clicks that trigger async actions
   - Show loading bars for long-running operations (PDF generation, exports)
   - Disable buttons during submission to prevent double-clicks

3. **Ensure transitions are smooth:**
   - Use Framer Motion (already in project) for skeleton → content transitions
   - Avoid layout shift (CLS) by matching skeleton dimensions to final content

**Output at the end of PHASE 3:**

- All code changes implemented
- A summary document (`docs/PERFORMANCE_AUDIT_PHASE3_COMPLETE.md`) listing:
  - Files modified
  - New components created
  - Pages improved
  - Performance metrics (if measurable)
  - Remaining TODOs (if any)

---

## Success Criteria

After completing all phases, the app should have:

1. ✅ **No blank screens** - Every page shows meaningful content (skeleton or shell) immediately
2. ✅ **Progressive loading** - Heavy sections load incrementally, not blocking the entire page
3. ✅ **Consistent UX** - All loading states use shared components and match the design system
4. ✅ **Parallel fetching** - No unnecessary sequential API calls
5. ✅ **Accessible** - Loading states have proper ARIA attributes
6. ✅ **Fast perceived performance** - Users see content quickly, even if some data is still loading

---

## Notes

- **Respect existing patterns:** If a pattern already exists (e.g., `QuizLoadingSkeleton`), enhance it rather than replacing it
- **Test on slow networks:** Use Chrome DevTools throttling to verify loading states work well
- **Mobile-first:** Ensure skeletons and loading states work well on mobile devices
- **Documentation:** Update component docs if you create new shared primitives

