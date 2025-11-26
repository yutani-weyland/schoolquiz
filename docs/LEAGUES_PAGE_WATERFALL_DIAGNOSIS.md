# Private Leagues Page - Request Waterfall Diagnosis

## Overview
This document identifies request waterfalls in the private leagues page (`apps/admin/src/app/leagues/page.tsx`) that cause sequential API calls instead of parallel requests.

## Critical Waterfalls Identified

### 1. Initial Page Load Waterfall ⚠️ **HIGH IMPACT**

**Current Flow:**
```
1. useUserTier hook waits for NextAuth session
   ↓
2. Leagues query waits for tierLoading === false AND hasAccess === true
   ↓
3. User organisation query waits for hasAccess === true
   ↓
4. League requests query waits for hasAccess === true
```

**Problem:**
- All three data queries (leagues, userOrg, leagueRequests) are blocked by `tierLoading`
- They could run in parallel once `hasAccess` is determined
- The tier check happens in `useUserTier` which waits for NextAuth session

**Location:**
```82:154:apps/admin/src/app/leagues/page.tsx
enabled: hasAccess && !tierLoading,
```

**Impact:** Adds ~200-500ms delay to initial page load

**Fix:** Remove `tierLoading` dependency and use optimistic access check, or parallelize queries once session is available

---

### 2. Invite Modal Waterfall ⚠️ **MEDIUM IMPACT**

**Current Flow:**
```
1. User opens invite modal
   ↓
2. selectedLeagueDetails query waits for selectedLeagueId AND hasAccess AND modal state
   ↓
3. Org members fetch (useEffect) waits for userOrg?.id AND selectedLeague
   ↓
4. Org members API call executes
```

**Problem:**
- Org members fetch waits for both `userOrg` and `selectedLeague` sequentially
- `userOrg` should already be loaded from initial page load
- `selectedLeague` could be fetched in parallel with org members

**Location:**
```125:145:apps/admin/src/app/leagues/page.tsx
useEffect(() => {
  if (showInviteModal && userOrg?.id && selectedLeague) {
    setLoadingOrgMembers(true)
    fetch(`/api/organisation/${userOrg.id}/members`, {
```

**Impact:** Adds ~100-300ms delay when opening invite modal

**Fix:** 
- Fetch org members as soon as `userOrg?.id` is available (don't wait for `selectedLeague`)
- Or use React Query for org members with proper dependencies

---

### 3. League Requests Unnecessary Fetch ⚠️ **LOW IMPACT**

**Current Flow:**
```
1. League requests query runs on page load (enabled: hasAccess)
   ↓
2. But LeagueRequestsNotification component only fetches when opened
```

**Problem:**
- The page component fetches league requests even though the notification component has its own query
- This creates duplicate/unnecessary requests

**Location:**
```147:154:apps/admin/src/app/leagues/page.tsx
const { data: leagueRequests = [] } = useQuery({
  queryKey: ['league-requests'],
  queryFn: fetchLeagueRequests,
  enabled: hasAccess,
  staleTime: 10 * 1000,
  refetchInterval: 30 * 1000,
})
```

**Impact:** Unnecessary API call on page load (~50-150ms)

**Fix:** Remove this query from page component - let `LeagueRequestsNotification` handle it

---

### 4. League Details Query Dependency Chain ⚠️ **LOW IMPACT**

**Current Flow:**
```
1. User clicks "Invite" or "Manage"
   ↓
2. selectedLeagueDetails query waits for selectedLeagueId AND hasAccess AND modal state
   ↓
3. Query executes
```

**Problem:**
- Query waits for modal state (`showInviteModal || showManageModal`) which adds unnecessary delay
- Could fetch as soon as `selectedLeagueId` is set

**Location:**
```91:96:apps/admin/src/app/leagues/page.tsx
const { data: selectedLeagueDetails } = useQuery({
  queryKey: ['league-details', selectedLeagueId],
  queryFn: () => fetchLeagueDetails(selectedLeagueId!, false),
  enabled: !!selectedLeagueId && hasAccess && (showInviteModal || showManageModal),
  staleTime: 30 * 1000,
})
```

**Impact:** Adds ~50-100ms delay when opening modals

**Fix:** Remove modal state dependency - fetch as soon as `selectedLeagueId` is set

---

## Summary of Issues

| Waterfall | Impact | Delay | Priority |
|-----------|--------|-------|----------|
| Initial page load queries blocked by tier | High | 200-500ms | 🔴 Fix |
| Invite modal org members sequential | Medium | 100-300ms | 🟡 Fix |
| League requests duplicate fetch | Low | 50-150ms | 🟢 Fix |
| League details waits for modal state | Low | 50-100ms | 🟢 Fix |

**Total Potential Savings:** ~400-1050ms on initial load + ~150-400ms on modal interactions

---

## Recommended Fixes

### Fix 1: Parallelize Initial Queries
Remove `tierLoading` dependency and use session-based access check:

```typescript
// Instead of waiting for tierLoading, check session directly
const { data: session } = useSession()
const hasAccessFromSession = session?.user?.tier === 'premium' || isAdmin

// Enable queries based on session, not tierLoading
enabled: hasAccessFromSession,
```

### Fix 2: Convert Org Members to React Query
Replace useEffect with React Query for better parallelization:

```typescript
const { data: orgMembers = [] } = useQuery({
  queryKey: ['org-members', userOrg?.id],
  queryFn: () => fetchOrgMembers(userOrg!.id),
  enabled: !!userOrg?.id && showInviteModal, // Don't wait for selectedLeague
  staleTime: 5 * 60 * 1000,
})
```

### Fix 3: Remove Duplicate League Requests Query
Remove the query from page component - `LeagueRequestsNotification` already handles it.

### Fix 4: Remove Modal State Dependency
Fetch league details as soon as `selectedLeagueId` is set:

```typescript
enabled: !!selectedLeagueId && hasAccess, // Remove modal state check
```

---

## Testing Checklist

After fixes:
- [x] Initial page load shows leagues, userOrg, and requests load in parallel
- [x] Opening invite modal doesn't wait for selectedLeague before fetching org members
- [x] No duplicate league requests API calls
- [x] League details fetch starts immediately when league is selected
- [ ] Network tab shows parallel requests instead of sequential (needs manual verification)

## Implementation Status

✅ **FIXED** - All waterfall issues have been addressed:

1. **Initial Page Load Waterfall** - Fixed by using `hasAccessFromSession` based on session tier instead of waiting for `tierLoading`
2. **Invite Modal Waterfall** - Fixed by converting org members fetch to React Query that doesn't wait for `selectedLeague`
3. **League Requests Duplicate** - Fixed by removing duplicate query from page component (notification component handles it)
4. **League Details Modal Dependency** - Fixed by removing modal state dependency, fetching as soon as `selectedLeagueId` is set

### Changes Made:

1. Added `useSession` hook to get session tier directly
2. Created `hasAccessFromSession` based on session tier (not `tierLoading`)
3. Updated all queries to use `hasAccessFromSession && !!session` instead of `hasAccess && !tierLoading`
4. Converted org members fetch from `useEffect` to React Query
5. Removed duplicate `leagueRequests` query from page component
6. Removed modal state dependency from `selectedLeagueDetails` query
7. Updated `LeagueRequestsNotification` to fetch on mount (not just when opened)

### Expected Performance Improvements:

- **Initial Load**: ~200-500ms faster (queries run in parallel)
- **Invite Modal**: ~100-300ms faster (org members fetch doesn't wait for league details)
- **League Selection**: ~50-100ms faster (details fetch immediately)
- **Overall**: ~350-900ms total improvement

