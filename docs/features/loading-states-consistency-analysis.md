# Loading States & Skeletons Consistency Analysis

## Current State Analysis

### Inconsistencies Found

#### 1. **Loading Pattern Approach**
- **Quizzes**: Uses Suspense fallback directly in page (no `loading.tsx`)
- **Achievements**: Uses Suspense fallback directly in page (no `loading.tsx`)
- **Custom Quizzes**: Uses Suspense fallback directly in page (no `loading.tsx`)
- **Leaderboards**: Uses Suspense fallback directly in page (no `loading.tsx`)
- **Leagues**: Has `loading.tsx` file (Next.js route-level loading)
- **Stats**: Has custom skeleton component (not using `loading.tsx`)

**Issue**: Mixed patterns - some use Next.js `loading.tsx`, others use Suspense fallbacks.

#### 2. **RouteLoading Wrapper Usage**
- **Quizzes**: No RouteLoading (uses QuizzesShell)
- **Achievements**: No RouteLoading (uses AchievementsShell)
- **Custom Quizzes**: No RouteLoading (uses CustomQuizzesShell)
- **Leaderboards**: No RouteLoading (uses LeaderboardsShell)
- **Leagues**: Uses RouteLoading with header
- **Custom Quizzes loading.tsx**: Uses RouteLoading with `showFooter={false}`
- **Leaderboards loading.tsx**: Uses RouteLoading with `showFooter={false}`
- **Stats**: No RouteLoading (includes SiteHeader/Footer directly)

**Issue**: Inconsistent wrapper usage - shell components vs RouteLoading.

#### 3. **Skeleton Counts**
- **Quizzes**: 6 cards
- **Achievements**: 8 cards (in Suspense), 8 cards (in loading.tsx)
- **Custom Quizzes**: 6 cards
- **Leaderboards**: 6 cards
- **Leagues**: Varies (list + details)

**Issue**: No clear standard for skeleton counts.

#### 4. **Header Skeleton**
- **Quizzes**: No header skeleton (shell renders immediately)
- **Achievements**: No header skeleton (shell renders immediately)
- **Custom Quizzes**: No header skeleton (shell renders immediately)
- **Leaderboards**: No header skeleton (shell renders immediately)
- **Achievements loading.tsx**: Uses `PageHeaderSkeleton`
- **Custom Quizzes loading.tsx**: Custom skeleton divs
- **Leaderboards loading.tsx**: Custom skeleton divs
- **Stats**: Custom skeleton divs

**Issue**: Inconsistent header skeleton patterns.

#### 5. **Container Max-Widths**
- **Quizzes**: `max-w-[1600px]`
- **Achievements**: `max-w-7xl`
- **Custom Quizzes**: `max-w-6xl` (shell), `max-w-7xl` (loading.tsx)
- **Leaderboards**: `max-w-7xl`
- **Leagues**: `max-w-7xl`
- **Stats**: `max-w-6xl`

**Issue**: Different max-widths without clear reasoning.

#### 6. **Padding Patterns**
- **Quizzes**: `px-6 sm:px-6 lg:px-8 xl:px-12`
- **Achievements**: `px-4`, `px-6`
- **Custom Quizzes**: `px-4 sm:px-6 lg:px-8`
- **Leaderboards**: `px-6 py-8`
- **Leagues**: `px-6 py-8`
- **Stats**: `px-4 sm:px-8`

**Issue**: Inconsistent padding patterns.

#### 7. **Wrong Skeleton Component**
- **Custom Quizzes loading.tsx**: Uses `QuizCardGridSkeleton` instead of `CustomQuizCardGridSkeleton`

**Issue**: Wrong component used.

## Recommended Standardization

### Pattern 1: Shell-First with Suspense (Recommended for Optimized Pages)

**Structure:**
```tsx
// page.tsx
export default function Page() {
  return (
    <PageShell>
      <Suspense fallback={<ContentSkeleton />}>
        <PageContent />
      </Suspense>
    </PageShell>
  )
}
```

**Benefits:**
- Shell renders immediately (header + title)
- Content streams in via Suspense
- Best LCP performance
- No `loading.tsx` needed

**Used by:** Quizzes, Achievements, Custom Quizzes, Leaderboards

### Pattern 2: Route-Level Loading (For Simpler Pages)

**Structure:**
```tsx
// page.tsx
export default function Page() {
  return <PageContent />
}

// loading.tsx
export default function Loading() {
  return (
    <RouteLoading>
      <PageSkeleton />
    </RouteLoading>
  )
}
```

**Benefits:**
- Simpler for pages without shell optimization
- Next.js handles loading automatically
- Good for admin/internal pages

**Used by:** Leagues (currently)

### Standard Skeleton Specifications

#### 1. **Skeleton Counts**
- **Grid layouts**: 6 items (2 columns on mobile, 3 on desktop)
- **List layouts**: 8 items
- **Cards**: 6 cards
- **Tables**: 5-10 rows depending on context

#### 2. **Container Max-Widths**
- **Main content pages**: `max-w-7xl` (consistent)
- **Wide content pages**: `max-w-[1600px]` (only for special cases like quizzes)
- **Narrow content**: `max-w-6xl` (for forms, settings)

#### 3. **Padding Pattern**
- **Standard**: `px-4 sm:px-6 lg:px-8`
- **Wide pages**: `px-6 sm:px-6 lg:px-8 xl:px-12` (only for quizzes)

#### 4. **Header Skeletons**
- **Shell-first pages**: No header skeleton (shell renders immediately)
- **Route-level loading**: Use `PageHeaderSkeleton` component

#### 5. **RouteLoading Usage**
- **Shell-first pages**: Don't use RouteLoading (shell handles layout)
- **Route-level loading**: Use RouteLoading with `showHeader={true}`, `showFooter={false}` (unless page needs footer)

## Action Items

### High Priority ✅ COMPLETED
1. ✅ **Fix Custom Quizzes loading.tsx**: Use `CustomQuizCardGridSkeleton` instead of `QuizCardGridSkeleton`
2. ✅ **Standardize container max-widths**: Use `max-w-7xl` for most pages
   - Updated: Custom Quizzes Shell, Stats page, Stats Client, Stats loading
   - Kept `max-w-[1600px]` for Quizzes/Achievements (intentional wide layout)
3. ✅ **Standardize padding**: Use `px-4 sm:px-6 lg:px-8` pattern
   - Updated: Custom Quizzes Shell, Leaderboards Shell, Stats page, Stats Client
4. ✅ **Standardize skeleton counts**: Use 6 for grids, 8 for lists
   - Verified: All pages already follow this standard

### Medium Priority ✅ COMPLETED
5. ✅ **Update Stats page**: Use RouteLoading consistently
   - Updated StatsSkeleton to use RouteLoading
   - Updated Stats loading.tsx to use RouteLoading + PageHeaderSkeleton
   - Standardized max-width and padding

6. ✅ **Decide on pattern**: Choose shell-first (current optimized pages) or route-level loading (simpler pages)
   - **Decision**: 
     - **Shell-first pattern** for optimized user-facing pages (Quizzes, Achievements, Custom Quizzes, Leaderboards)
     - **Route-level loading** (`loading.tsx`) for:
       - Complex client-side pages (Leagues - heavily interactive)
       - Admin pages
       - Pages that don't benefit from shell-first optimization
   - **Benefits**: Shell-first improves LCP for data-heavy pages, route-level is simpler for interactive pages

7. ✅ **Update Leagues page**: Standardized loading pattern
   - Updated loading.tsx to use RouteLoading + PageHeaderSkeleton
   - Added skeleton for action buttons and tabs to match page structure
   - Kept `max-w-[1600px]` (matches Quizzes/Achievements wide layout)
   - **Note**: Leagues remains client-side due to heavy interactivity (modals, tabs, drag-drop). Shell-first conversion would require significant refactoring.

### Low Priority
8. **Create loading state guidelines**: Document in codebase
9. **Add loading state tests**: Ensure consistency in CI

## Recommended Standard Components

### Standard Suspense Fallback Pattern
```tsx
<Suspense fallback={<ContentSkeleton count={6} />}>
  <PageContent />
</Suspense>
```

### Standard Route Loading Pattern
```tsx
// loading.tsx
export default function PageLoading() {
  return (
    <RouteLoading>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeaderSkeleton />
        <ContentSkeleton count={6} />
      </div>
    </RouteLoading>
  )
}
```

