# Apply Migration 007: Update Referral System

## Step 1: Open Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)

## Step 2: Copy and Run the Migration

1. Open the file: `supabase/migrations/007_update_referral_system.sql`
2. Copy the entire contents
3. Paste into the SQL Editor in Supabase
4. Click **Run** (or press Cmd/Ctrl + Enter)

## Step 3: Verify the Migration

After running, verify the changes by running this query:

```sql
-- Check users table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('freeMonthsGranted', 'referralCount')
ORDER BY column_name;

-- Check referrals table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'referrals'
ORDER BY column_name;
```

**Expected results:**
- `users` table should have `freeMonthsGranted` column (NOT `referralCount`)
- `referrals` table should have:
  - `reward_granted_at`
  - `referrer_rewarded`
  - `referred_rewarded`
  - Should NOT have `referred_user_tier` or `counted_at`

## Step 4: Test the Schema

Run this to verify everything works:

```sql
-- Check if we can query the new columns
SELECT 
  id,
  email,
  "freeMonthsGranted",
  "referralCode"
FROM users
LIMIT 5;

-- Check referrals table structure
SELECT * FROM referrals LIMIT 1;
```

If these queries run without errors, the migration was successful!

## Troubleshooting

**Error: "column does not exist"**
- The migration uses `IF EXISTS` checks, so this shouldn't happen
- If it does, the table structure might be different than expected

**Error: "relation referrals does not exist"**
- The migration will create the table if it doesn't exist
- If you still get this error, run migration 006 first, or check table name spelling

**Error: "permission denied"**
- Make sure you're running as the database owner
- Check your Supabase project permissions

## Next Steps

After successful migration:
1. ✅ Regenerate Prisma client (already done)
2. ✅ Test the referral system
3. Configure Stripe webhook
4. Test end-to-end flow

