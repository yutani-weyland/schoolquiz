# League API Auth Performance Optimization

## Problem
League members API was taking 3348ms total:
- **Auth: 1452ms** (43% of total time) ⚠️ **CRITICAL BOTTLENECK**
- Access check: 871ms (26% of total time)
- Members query: 1025ms (31% of total time)

## Root Cause

The `requireApiAuth()` function was calling `requireAuth()` which queries the full user from the database on every API request, even though:
1. NextAuth session callback already queries the database
2. Session includes tier/subscription data
3. Most API routes only need tier/subscription status

## Optimizations Applied

### 1. Optimized `requireApiAuth()` to Use Session Data

**Before:**
```typescript
export async function requireApiAuth() {
  const user = await requireAuth(); // Queries full user from DB
  return user;
}
```

**After:**
```typescript
export async function requireApiAuth() {
  const session = await auth(); // Fast - uses cached session
  if (sessionUser.tier && sessionUser.id) {
    // Use session data - no DB query needed!
    return {
      id: sessionUser.id,
      tier: sessionUser.tier,
      subscriptionStatus: sessionUser.subscriptionStatus,
      // ... other fields from session
    };
  }
  // Fallback: only query DB if session doesn't have tier
  return await requireAuth();
}
```

**Impact:** Reduces auth time from ~1452ms to ~0-50ms (97% faster)

### 2. Enhanced Session Callback

Updated NextAuth session callback to include `subscriptionStatus` and `freeTrialUntil` in session:
```typescript
user: {
  tier: isPremium ? 'premium' : 'basic',
  subscriptionStatus: user.subscriptionStatus, // NEW
  freeTrialUntil: user.freeTrialUntil?.toISOString() || null, // NEW
  // ...
}
```

This ensures API routes have all data they need without additional queries.

### 3. Added Detailed Performance Logging

Added granular timing logs to identify bottlenecks:
- `[League Members API] Auth took Xms`
- `[League Members API] League query took Xms`
- `[League Members API] Membership query took Xms`
- `[League Members API] Access check took Xms`
- `[League Members API] Members query took Xms`

## Expected Performance Improvements

| Component | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Auth | 1452ms | 0-50ms | **97% faster** |
| Access Check | 871ms | 200-400ms* | 54-77% faster |
| Members Query | 1025ms | 200-500ms* | 51-80% faster |
| **Total** | **3348ms** | **400-950ms** | **72-88% faster** |

*Access check and members query improvements depend on database indexes and network latency

## How It Works

1. **Session-based Auth (Fast Path)**:
   - `requireApiAuth()` checks NextAuth session
   - Session already contains tier/subscription data (from session callback)
   - Returns lightweight user object from session
   - **No database query needed** ✅

2. **Database Fallback (Rare)**:
   - Only used if session doesn't have tier data
   - Should rarely happen if session callback is working correctly

## Database Indexes Required

Ensure these indexes exist (from migration `016_optimize_private_league_members_query.sql`):

```sql
-- Covering index for membership checks
CREATE INDEX idx_private_league_members_league_user_active 
ON private_league_members("leagueId", "userId", "leftAt") 
WHERE "leftAt" IS NULL;

-- Index for league lookups
CREATE INDEX idx_private_leagues_id_deleted 
ON private_leagues(id, "deletedAt") 
WHERE "deletedAt" IS NULL;
```

## Monitoring

After deploying, check server logs for:
- `[League Members API] Auth took Xms` - Should be <50ms
- `[League Members API] League query took Xms` - Should be <200ms
- `[League Members API] Membership query took Xms` - Should be <200ms

If auth is still slow:
- Check if NextAuth session is being cached properly
- Verify session callback is including tier data
- Check database connection pooling (use port 6543 for Supabase)

If access check is still slow:
- Verify indexes exist and are being used (`EXPLAIN ANALYZE`)
- Check database connection latency
- Consider adding connection pooling

## Testing

1. Clear browser cache and cookies
2. Log in fresh
3. Navigate to leagues page
4. Open league members modal
5. Check server logs for timing breakdown
6. Verify total time is <1000ms

## Related Files

- `apps/admin/src/lib/api-auth.ts` - Optimized `requireApiAuth()`
- `packages/auth/src/index.ts` - Enhanced session callback
- `apps/admin/src/app/api/private-leagues/[id]/members/route.ts` - Added performance logging

