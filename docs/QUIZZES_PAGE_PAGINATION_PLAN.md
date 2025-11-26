# Quizzes Page - Pagination & Performance Enhancements Needed

## Current State Analysis

### Official Quizzes
- **Count:** 12 quizzes (hardcoded array)
- **Rendered:** All 12 at once
- **Issue:** Small list, but no pagination/lazy loading
- **Status:** Acceptable for now (12 is manageable), but could benefit from lazy loading

### Custom Quizzes
- **Count:** Up to 50 quizzes per user (storage limit)
- **Current Query:** Fetches ALL custom quizzes (no limit, no pagination)
- **Rendered:** All at once
- **Issue:** ❌ **CRITICAL** - Could load 50 quizzes at once, causing:
  - Large initial payload
  - Slow rendering
  - Poor performance on slower devices

### Completions
- **Current:** Has `take: 20` limit (safety measure)
- **Status:** ✅ Good - limited query

## Performance Issues Found

1. ❌ **No pagination for custom quizzes** - Fetches all 50 potentially
2. ❌ **All quizzes rendered at once** - No lazy loading or virtual scrolling
3. ❌ **Large initial payload** - Sends all quiz metadata to client
4. ⚠️ **Framer Motion animations** - Heavy client-side animations on all cards
5. ⚠️ **Entire page is client component** - No server-rendered shell

## Recommended Optimizations

### Priority 1: Add Pagination/Limit to Custom Quizzes
- **Add:** `take: 12` limit to initial fetch (show first 12)
- **Add:** "Load More" button or infinite scroll
- **Impact:** ~75% reduction in initial payload if user has many quizzes

### Priority 2: Lazy Load Official Quizzes
- **Initial:** Show first 6 quizzes
- **On Scroll:** Load next 6 (lazy loading)
- **Impact:** Faster initial render

### Priority 3: Virtual Scrolling
- **Use:** `@tanstack/react-virtual` (already in project for leagues)
- **Benefit:** Only render visible quizzes
- **Impact:** Better performance with many quizzes

### Priority 4: Reduce Animation Bundle
- **Current:** Framer Motion on every card
- **Optimize:** Lazy load animations or reduce animation complexity
- **Impact:** Smaller JS bundle, faster hydration

