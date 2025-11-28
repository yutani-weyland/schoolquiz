# League Prefetching Optimization

## Problem
When users click on a league to view details or members, they had to wait 2-3 seconds for data to load. This created a poor user experience.

## Solution
Prefetch league details and members data **before** users click, so modals open instantly.

## Implementation

### 1. Immediate Prefetching (First 6 Leagues)
When leagues load, immediately prefetch data for the first 6 visible leagues:

```typescript
useEffect(() => {
  if (!leagues.length || !hasAccessFromSession || !session) return

  const leaguesToPrefetch = leagues.slice(0, 6)
  
  leaguesToPrefetch.forEach((league) => {
    // Prefetch league details (lightweight, no members)
    queryClient.prefetchQuery({
      queryKey: ['league-details', league.id],
      queryFn: () => fetchLeagueDetails(league.id, false),
      staleTime: 30 * 1000,
    })
    
    // Prefetch first page of members (for members modal)
    queryClient.prefetchQuery({
      queryKey: ['league-members', league.id],
      queryFn: () => fetchLeagueMembers(league.id, 50, 0),
      staleTime: 10 * 1000,
    })
  })
}, [leagues, hasAccessFromSession, session, queryClient])
```

**Location**: `apps/admin/src/app/leagues/page.tsx`

### 2. Viewport-Based Prefetching (Intersection Observer)
As users scroll, prefetch data for leagues coming into viewport:

```typescript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const leagueId = entry.target.getAttribute('data-league-id')
        if (leagueId && !prefetchedLeagues.current.has(leagueId)) {
          prefetchedLeagues.current.add(leagueId)
          
          // Prefetch league details and members
          queryClient.prefetchQuery(...)
        }
      }
    })
  },
  {
    rootMargin: '200px', // Start prefetching 200px before visible
  }
)
```

**Location**: `apps/admin/src/components/leagues/LeaguesGrid.tsx`

## How It Works

1. **Page Load**: First 6 leagues are prefetched immediately
2. **Scroll**: As leagues come into viewport (200px before visible), they're prefetched
3. **Click**: When user clicks, data is already loaded or loading → instant modal

## Benefits

- **Instant Modals**: Data is ready when user clicks
- **Progressive Loading**: Only prefetches visible leagues (not all at once)
- **Smart Caching**: React Query caches prefetched data
- **No Duplicate Requests**: Tracks prefetched leagues to avoid duplicates

## Performance Impact

**Before**:
- Click league → Wait 2-3 seconds → Modal opens

**After**:
- Click league → Modal opens instantly (data already loaded)
- Background prefetching happens during idle time

## Cache Strategy

- **League Details**: Cached for 30 seconds
- **League Members**: Cached for 10 seconds
- **React Query**: Automatically manages cache invalidation

## Edge Cases Handled

1. **Already Prefetched**: Tracks prefetched leagues to avoid duplicates
2. **No Access**: Only prefetches if user has access
3. **No Session**: Waits for session before prefetching
4. **Empty Leagues**: Skips if no leagues loaded

## Future Enhancements

1. **Hover Prefetching**: Prefetch on hover (more aggressive)
2. **Priority Queue**: Prefetch visible leagues first, then others
3. **Adaptive Prefetching**: Adjust based on user behavior
4. **Network-Aware**: Skip prefetching on slow connections

## Related Files

- `apps/admin/src/app/leagues/page.tsx` - Immediate prefetching
- `apps/admin/src/components/leagues/LeaguesGrid.tsx` - Viewport prefetching
- `apps/admin/src/lib/leagues-fetch.ts` - Fetch functions

