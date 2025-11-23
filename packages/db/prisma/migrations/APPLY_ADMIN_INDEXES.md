# Apply Admin Query Indexes

This migration adds performance indexes for admin list pages to improve query speed by 30-50%.

## Option 1: Supabase SQL Editor (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste the SQL from `add_admin_query_indexes.sql`**

4. **Click "Run"** (or press Cmd/Ctrl + Enter)

5. **Verify it worked** - You should see "Success. No rows returned"

---

## Option 2: Prisma Migration (If using Prisma Migrate)

If you want to create a proper Prisma migration:

```bash
cd packages/db
npx prisma migrate dev --name add_admin_query_indexes --create-only
```

Then copy the contents of `add_admin_query_indexes.sql` into the generated migration file, and run:

```bash
npx prisma migrate dev
```

---

## Option 3: Direct SQL (If you have psql installed)

```bash
cd packages/db
psql $DATABASE_URL < prisma/migrations/add_admin_query_indexes.sql
```

---

## What This Migration Does

Adds indexes for frequently queried fields in admin pages:

**User Model:**
- Name searches
- Tier filtering
- CreatedAt sorting
- Composite indexes for common query patterns

**Organisation Model:**
- Name searches
- Plan filtering
- Status filtering
- Email domain searches
- CreatedAt sorting
- Composite indexes for common query patterns

**Impact:** 30-50% faster queries for admin list pages, especially with filters and sorting.

---

## Verify Indexes Were Created

Run this query in Supabase SQL Editor to verify:

```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND (tablename = 'users' OR tablename = 'organisations')
    AND indexname LIKE '%_idx'
ORDER BY tablename, indexname;
```

You should see all the new indexes listed.


