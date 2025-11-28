# League Members Query Performance Optimization

## Current Status

After auth optimization, members query is still taking **~1034ms**. This document outlines optimizations and next steps.

## Query Breakdown

The members endpoint performs:
1. **Members query with user join**: Fetches member records + user names
2. **Count query**: Gets total member count

## Optimizations Applied

### 1. Added Detailed Performance Logging

Now logs:
- `[League Members API] Members query (with join, ordered) took Xms`
- `[League Members API] Count query took Xms`

This helps identify which query is slow.

### 2. Made ORDER BY Optional

Added `?orderBy=none` query param to skip ordering if not needed:
```
/api/private-leagues/{id}/members?orderBy=none
```

**Note**: ORDER BY with OFFSET can be slow on large datasets. If you have 1000+ members, consider:
- Removing ORDER BY for pagination
- Using cursor-based pagination instead of OFFSET
- Sorting on the client side

### 3. Query Structure

Current query:
```typescript
privateLeagueMember.findMany({
  where: { leagueId: id, leftAt: null },
  select: {
    id: true,
    userId: true,
    joinedAt: true,
    user: { select: { id: true, name: true } },
  },
  orderBy: { joinedAt: 'asc' },
  take: limit,
  skip: offset,
})
```

This should use:
- `idx_private_league_members_league_active` for WHERE clause
- `idx_private_league_members_league_joined` for ORDER BY

## Potential Causes of Slowness

### 1. Network Latency (Most Likely)
If using Supabase remote database:
- **Check**: Database connection latency
- **Solution**: Use connection pooler (port 6543 for Supabase)
- **Check**: `DATABASE_URL` should use pooler URL

### 2. Index Not Being Used
- **Check**: Run `EXPLAIN ANALYZE` on the query
- **Solution**: Ensure indexes exist and are being used
- **Check**: Run `ANALYZE private_league_members` to update stats

### 3. Large Dataset with OFFSET
- **Problem**: `OFFSET` requires scanning all previous rows
- **Solution**: Use cursor-based pagination (use `joinedAt` as cursor)
- **Alternative**: Remove ORDER BY for large datasets

### 4. Join to Users Table
- **Problem**: Join might be slow if users table is large
- **Check**: Logs will show if join is the bottleneck
- **Solution**: Batch fetch users separately if needed

## Next Steps

### 1. Check Logs
After deploying, check server logs for:
```
[League Members API] Members query (with join, ordered) took Xms
[League Members API] Count query took Xms
```

This will show which query is slow.

### 2. Verify Indexes
Run in Supabase SQL editor:
```sql
-- Check if indexes exist
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'private_league_members';

-- Check index usage
EXPLAIN ANALYZE
SELECT id, "userId", "joinedAt"
FROM private_league_members
WHERE "leagueId" = 'YOUR_LEAGUE_ID' AND "leftAt" IS NULL
ORDER BY "joinedAt" ASC
LIMIT 100 OFFSET 0;
```

Look for:
- `Index Scan using idx_private_league_members_league_joined`
- Not `Seq Scan` (sequential scan is slow)

### 3. Check Connection Pooling
If using Supabase, ensure `DATABASE_URL` uses pooler:
```
postgresql://user:pass@host:6543/dbname  # Pooler port
```

Not:
```
postgresql://user:pass@host:5432/dbname  # Direct connection
```

### 4. Consider Cursor-Based Pagination
If OFFSET is slow, switch to cursor-based:

```typescript
// Instead of OFFSET, use cursor
const cursor = searchParams.get('cursor') // joinedAt timestamp
const members = await prisma.privateLeagueMember.findMany({
  where: {
    leagueId: id,
    leftAt: null,
    joinedAt: cursor ? { gt: new Date(cursor) } : undefined,
  },
  orderBy: { joinedAt: 'asc' },
  take: limit,
})
```

### 5. Optimize Count Query
If count is slow, consider:
- **Estimate**: Use `pg_class.reltuples` for approximate count
- **Cache**: Cache count and invalidate on member add/remove
- **Lazy**: Don't fetch count unless needed

## Expected Performance

With proper indexes and connection pooling:
- **Members query**: 50-200ms (depending on dataset size)
- **Count query**: 50-150ms
- **Total**: 100-350ms

If still slow after these checks:
1. Check database connection latency
2. Consider read replicas for read-heavy queries
3. Implement caching for member lists

## Related Files

- `apps/admin/src/app/api/private-leagues/[id]/members/route.ts` - Members endpoint
- `supabase/migrations/016_optimize_private_league_members_query.sql` - Indexes

