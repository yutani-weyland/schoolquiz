# Optimize Database Connection for Performance

## Step 1: Check Your DATABASE_URL

Your current `DATABASE_URL` might be using a direct connection (port 5432), which is slower. We want to use Supabase's **connection pooler** (port 6543) for better performance.

### How to Check:

1. **Find your `.env.local` file** (in the project root or `apps/admin/`)

2. **Look at your DATABASE_URL** - it should look like one of these:

   ❌ **Direct Connection (Slower)**:
   ```
   DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
   ```
   - Uses port `:5432`
   - Hostname ends with `db.[ref].supabase.co`

   ✅ **Connection Pooler (Faster)**:
   ```
   DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
   ```
   - Uses port `:6543`
   - Hostname includes `pooler.supabase.com`

### If You Need to Update It:

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Get Connection Pooler String**:
   - Go to **Settings** → **Database**
   - Scroll to **Connection string** section
   - Click the **"Connection pooling"** tab
   - Select **"Transaction"** mode
   - Copy the connection string

3. **Update `.env.local`**:
   ```bash
   # Open .env.local in your editor
   # Replace the DATABASE_URL line with the pooler connection string
   ```

4. **Sync to app directory**:
   ```bash
   pnpm sync-env
   ```

5. **Restart your dev server**:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   pnpm dev
   ```

---

## Step 2: Apply Database Index Migration

We created a migration file that adds optimized indexes to speed up your queries.

### Apply the Migration:

**Option A: Using Prisma CLI (Recommended)**

```bash
# Navigate to the db package
cd packages/db

# Apply all pending migrations (including the new index migration)
npx prisma migrate deploy

# Or if you're in development:
npx prisma migrate dev
```

**Option B: Using Supabase SQL Editor**

1. **Go to Supabase Dashboard** → Your Project → **SQL Editor**

2. **Create a new query** and paste the contents of:
   ```
   supabase/migrations/010_optimize_private_league_stats_indexes.sql
   ```

3. **Run the query**

### Verify the Migration:

Run this SQL query in Supabase SQL Editor to check if indexes exist:

```sql
SELECT 
    indexname, 
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'private_league_stats'
ORDER BY indexname;
```

You should see these new indexes:
- `idx_private_league_stats_league_overall`
- `idx_private_league_stats_league_id`
- `idx_private_league_stats_league_quiz_optimized`

---

## Step 3: Test Performance

After updating the connection string and applying migrations:

1. **Restart your dev server**
2. **Load the private leagues page**
3. **Check the terminal logs** - you should see improved timing:
   - User query should be faster (connection pooler reduces overhead)
   - Stats queries should be faster (new indexes)

---

## Troubleshooting

### "Connection refused" or "Can't connect"

- Make sure you're using the **Connection pooling** string, not the direct connection
- Check that your IP isn't blocked in Supabase Dashboard → Settings → Database → IP Restrictions

### Migration fails

- Make sure you have the correct database permissions
- Try running migrations directly in Supabase SQL Editor as a fallback

### Still slow after changes?

- Network latency to Supabase can't be eliminated entirely
- Consider deploying your app closer to your Supabase region
- Check if you have a stable internet connection

