# Preloading and Caching Optimizations

**Date**: 2025-01-XX  
**Goal**: Match Kahoot's fast perceived performance through intelligent preloading and caching

---

## Overview

Implemented comprehensive preloading and caching strategies to make quiz navigation feel instant, similar to Kahoot's performance.

---

## ✅ Implemented Optimizations

### 1. **Link Prefetching on Hover** (`QuizCard.tsx`)

**What**: When users hover over a quiz card, prefetch the intro and play pages in the background.

**Implementation**:
- Added `router.prefetch()` calls on mouse enter (with 200ms debounce)
- Prefetches both `/quizzes/[slug]/intro` and `/quizzes/[slug]/play` routes
- Also prefetches quiz data API endpoint with low priority
- Cleans up prefetch timeout on mouse leave

**Impact**: Quiz pages load instantly when clicked (data already in browser cache)

**Code Location**: `apps/admin/src/components/quiz/QuizCard.tsx`

---

### 2. **Background Preloading of Newest Quiz** (`QuizzesClient.tsx`)

**What**: Automatically preload the newest quiz when user lands on the quizzes page.

**Implementation**:
- On page load, prefetches intro and play pages for the newest quiz
- Prefetches quiz data API in background with low priority
- Only runs for official quizzes (not custom quizzes view)

**Impact**: Most common user action (clicking newest quiz) is preloaded before user even hovers

**Code Location**: `apps/admin/src/app/quizzes/QuizzesClient.tsx`

---

### 3. **Lightweight Metadata API Endpoint** (`/api/quizzes/[slug]/metadata`)

**What**: New API endpoint that returns only quiz metadata (no questions/rounds).

**Implementation**:
- Returns: `id`, `slug`, `title`, `blurb`, `weekISO`, `colorHex`, `status`, `roundCount`
- Uses optimized database query with `select` (not `include`)
- Falls back to hardcoded metadata if database unavailable
- Much faster than full quiz data endpoint

**Impact**: Faster initial loads when only metadata is needed

**Code Location**: `apps/admin/src/app/api/quizzes/[slug]/metadata/route.ts`

---

### 4. **Preloading on Intro Page** (`QuizIntro.tsx`)

**What**: When user lands on quiz intro page, preload quiz data in background.

**Implementation**:
- Uses `requestIdleCallback` (or setTimeout fallback) to prefetch quiz data
- Prefetches `/api/quizzes/[slug]/data` with low priority
- Doesn't block page rendering or user interaction

**Impact**: When user clicks "Start Quiz", data is already loaded

**Code Location**: `apps/admin/src/components/quiz/QuizIntro.tsx`

---

### 5. **Router Prefetching in Intro Page** (`/quizzes/[slug]/intro/page.tsx`)

**What**: Prefetch play page route when intro page loads.

**Implementation**:
- Uses Next.js `router.prefetch()` to prefetch play page route
- Runs immediately when intro page component mounts

**Impact**: Route transition to play page is instant

**Code Location**: `apps/admin/src/app/quizzes/[slug]/intro/page.tsx`

---

## Performance Characteristics

### Prefetching Strategy

1. **On Quizzes Page Load**: Newest quiz intro/play pages + data
2. **On Card Hover**: Intro/play pages + data (debounced 200ms)
3. **On Intro Page Load**: Play page route + quiz data (idle callback)

### Caching Layers

1. **Server-side**: `QuizService` cache (5-minute TTL)
2. **Next.js Router**: Route prefetching (browser cache)
3. **Browser**: HTTP cache for API responses

---

## How It Works (User Journey)

### Scenario: User clicks newest quiz

1. **Quizzes Page Load** (0ms)
   - Newest quiz intro/play pages prefetched
   - Quiz data prefetched in background

2. **User Hovers Card** (200ms delay)
   - Intro/play pages prefetched (if not already)
   - Quiz data prefetched (if not already)

3. **User Clicks Card** (instant)
   - Intro page loads from cache (instant)
   - Quiz data already in browser cache

4. **Intro Page Loads** (0ms)
   - Play page route prefetched
   - Quiz data prefetched in background (idle callback)

5. **User Clicks "Start Quiz"** (instant)
   - Play page loads from cache (instant)
   - Quiz data already in browser cache

**Result**: Every step feels instant, similar to Kahoot's performance.

---

## Technical Details

### Debouncing
- Card hover prefetching uses 200ms debounce to avoid excessive requests
- Prevents prefetching when user quickly moves mouse across cards

### Priority Hints
- API prefetching uses `priority: 'low'` to not interfere with critical requests
- Browser will only fetch when idle

### Error Handling
- All prefetch operations silently fail (best-effort)
- Doesn't break user experience if prefetch fails

### Browser Compatibility
- Uses `requestIdleCallback` when available (Chrome, Firefox, Safari 15.4+)
- Falls back to `setTimeout` for older browsers

---

## Future Enhancements

### Progressive Loading (Not Yet Implemented)

For true Kahoot-like progressive loading:

1. **Load metadata first**: Show quiz UI immediately with metadata
2. **Load questions progressively**: Load first question, then preload next
3. **Preload adjacent questions**: When on question N, preload N+1 and N-1

This would require refactoring `QuizPlayer` to support:
- Client-side question fetching
- Progressive question loading
- Question-level caching

**Estimated Impact**: Even faster perceived performance, especially on slow connections

---

## Testing Recommendations

1. **Test prefetching**:
   - Open Network tab
   - Hover over quiz cards
   - Verify intro/play pages prefetched
   - Verify API data prefetched

2. **Test background preloading**:
   - Load quizzes page
   - Check Network tab for newest quiz prefetching

3. **Test intro page preloading**:
   - Navigate to quiz intro
   - Check Network tab for play page + data prefetching

4. **Measure performance**:
   - Time to interactive (TTI) should improve
   - Click-to-play latency should be < 100ms

---

## Notes

- Prefetching is best-effort and doesn't block user interaction
- All prefetch operations are low-priority to avoid impacting critical requests
- Existing server-side caching (5-minute TTL) still applies
- Metadata endpoint is optional - full data endpoint still works

