# Speculation Rules API Implementation

## Overview

The Speculation Rules API allows browsers to prerender pages before users click on links, making navigation feel instant (0ms perceived latency). Pages are prerendered in a background tab/process.

**Browser Support:** Chrome 109+, Edge 109+ (falls back gracefully in unsupported browsers)

## Implementation Status

### ✅ Fully Implemented

1. **Admin Navigation** (`AdminSpeculationRules`)
   - **Location:** `apps/admin/src/components/admin/AdminSpeculationRules.tsx`
   - **Usage:** Added to admin layout (`apps/admin/src/app/admin/layout.tsx`)
   - **Coverage:** All admin sidebar navigation links
   - **Eagerness:** `conservative` (prerenders on hover/focus)
   - **Impact:** High - Admin users frequently navigate between admin pages

2. **Site-Wide Navigation** (`SiteSpeculationRules`)
   - **Location:** `apps/admin/src/components/SiteSpeculationRules.tsx`
   - **Usage:** Added to root layout (`apps/admin/src/app/layout.tsx`)
   - **Coverage:** Context-aware prerendering based on current page + tier-specific URLs
   - **Eagerness:** `conservative`
   - **Impact:** Medium-High - Common navigation paths
   - **Enhancement:** Now includes tier-specific navigation (premium users get custom-quizzes, leagues, stats)

3. **Quiz Card Navigation** ⭐⭐⭐
   - **Location:** `apps/admin/src/components/quiz/QuizzesGrid.tsx`
   - **Coverage:** Prerenders quiz intro pages for visible quiz cards (top 8)
   - **Eagerness:** `moderate` (prerender on hover + after 2s of mouse inactivity)
   - **Impact:** Very High - Primary navigation path for users
   - **Implementation:** Automatically generates URLs from visible quiz cards

4. **Command Palette Results** ⭐⭐⭐
   - **Location:** `apps/admin/src/components/admin/CommandPalette.tsx`
   - **Coverage:** Prerenders top 5 search results when palette is open
   - **Eagerness:** `moderate` (prerender on hover + after 2s of mouse inactivity)
   - **Impact:** High - Fast navigation method for power users
   - **Implementation:** Dynamically updates based on filtered commands

5. **Footer Links** ⭐⭐
   - **Location:** `apps/admin/src/components/Footer.tsx`
   - **Coverage:** All footer navigation links (quizzes, about, contact, help, achievements, account, upgrade, privacy, terms)
   - **Eagerness:** `conservative` (prerender on hover/focus)
   - **Impact:** Medium - Predictable but less frequent navigation

6. **Base Component** (`SpeculationRules`)
   - **Location:** `apps/admin/src/components/SpeculationRules.tsx`
   - **Features:**
     - Supports both list rules (specific URLs) and document rules (all same-origin links)
     - Configurable eagerness levels
     - Graceful fallback for unsupported browsers
     - Hook version available (`useSpeculationRules`)
     - Defaults to document rules when no URLs provided

## Additional Areas for Future Consideration

### 1. Breadcrumb Navigation ⭐

**Current State:** Breadcrumbs show navigation hierarchy
**Location:** `apps/admin/src/components/admin/Breadcrumbs.tsx`

**Recommendation:**
- Prerender parent pages when on child pages
- Use `conservative` eagerness

**Impact:** Low-Medium - Breadcrumbs are less frequently clicked

### 2. Quiz Card Stack (Landing Page) ⭐⭐

**Current State:** Landing page has quiz card stack
**Location:** `apps/admin/src/components/marketing/QuizCardStack.tsx`

**Recommendation:**
- Prerender quiz intro pages for visible cards in the stack
- Use `moderate` eagerness
- Limit to top 3 cards

**Impact:** Medium-High - Landing page is a key entry point

### 3. Admin Topbar Quick Access ⭐

**Current State:** Quick access dropdown with links
**Location:** `apps/admin/src/components/admin/AdminTopbar.tsx`

**Note:** Already covered by `AdminSpeculationRules` - could add more aggressive prerendering if needed

**Impact:** Medium - Quick access is convenient but less frequent than sidebar

## Eagerness Levels Guide

- **`conservative`** (default): Prerender only on hover/focus
  - Best for: Most navigation links, footer links
  - Resource usage: Low
  - Use when: Links are visible but not always clicked

- **`moderate`**: Prerender on hover/focus + after 2s of mouse inactivity
  - Best for: High-value navigation (quiz cards, command palette)
  - Resource usage: Medium
  - Use when: Links are likely to be clicked but not immediately

- **`eager`**: Prerender on hover/focus + after 200ms of mouse inactivity
  - Best for: Very high-value navigation
  - Resource usage: High
  - Use when: Links are very likely to be clicked soon

- **`immediate`**: Prerender immediately when page loads
  - Best for: Critical navigation paths (e.g., "Play Quiz" button)
  - Resource usage: Very High
  - Use sparingly: Only for the most critical paths

## Best Practices

1. **Start Conservative**: Use `conservative` eagerness by default, upgrade only when needed
2. **Limit URLs**: Don't prerender too many URLs at once (max 10-15 per component)
3. **Context-Aware**: Use different rules based on current page/route
4. **Monitor Performance**: Watch for increased bandwidth usage and adjust accordingly
5. **Test in Production**: Speculation Rules work best with real user behavior patterns

## Testing

To verify Speculation Rules are working:

1. Open Chrome DevTools → Network tab
2. Filter by "Prerender" or "Speculation"
3. Hover over links that have speculation rules
4. You should see prerender requests in the network tab

## Performance Considerations

- **Bandwidth**: Prerendering uses bandwidth even if users don't click
- **Server Load**: Prerendering creates additional server requests
- **Memory**: Prerendered pages consume browser memory
- **Battery**: More aggressive prerendering can drain battery on mobile devices

**Recommendation:** Monitor these metrics and adjust eagerness levels accordingly.

## Future Enhancements

1. **Dynamic URL Generation**: Generate speculation rules based on user behavior analytics
2. **A/B Testing**: Test different eagerness levels to find optimal balance
3. **Conditional Rules**: Only prerender for authenticated users or specific user tiers
4. **Analytics Integration**: Track which prerendered pages are actually clicked

