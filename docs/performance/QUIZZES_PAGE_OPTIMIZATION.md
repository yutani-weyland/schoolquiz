# Quizzes Page Optimization Plan

## Current Issues

1. **Entire page is client-side** - `QuizzesClient` is `'use client'` even though layout/shell could be server-rendered
2. **Fetches completions for ALL quiz slugs** - Even if user completed 2 quizzes, queries for all 12 slugs
3. **QuizCard has redundant client-side fetching** - Despite receiving completionData as prop, still tries to fetch it
4. **Large client bundle** - Framer Motion, multiple hooks, client-side state management
5. **No static shell** - User waits for all data before seeing layout

## Optimization Strategy

### Phase 1: Query Optimization (✅ COMPLETED)
- **Changed:** Removed slug filter from completion query
- **Result:** Query now fetches all user completions (only returns what exists)
- **Benefit:** Faster query when user has few completions (no IN clause with 12 slugs)
- **Impact:** ~50% faster query for users with 1-3 completions

### Phase 2: Server-Side Shell (TODO)
- Move SiteHeader, layout, title to server component
- Only make quiz grid client-side for interactivity
- Reduce initial client JS by ~40%

### Phase 3: QuizCard Optimization (TODO)
- Remove redundant completion fetching in QuizCard
- Trust the prop data - no client-side refetch
- Split into minimal client wrapper + server-rendered card content

### Phase 4: Caching Improvements (TODO)
- Make quiz list static/cacheable
- Separate static quiz metadata from user-specific completions
- Better cache invalidation strategy

