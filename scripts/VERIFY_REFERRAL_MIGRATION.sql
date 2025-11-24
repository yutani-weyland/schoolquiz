-- Verification script for referral system migration
-- Run this after applying migration 007 to verify everything is correct

-- 1. Check users table columns
SELECT 
  'Users table columns' as check_type,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN (
    'freeMonthsGranted',
    'referralCount',  -- Should NOT exist
    'referralCode',
    'referredBy',
    'nextCycleFree',
    'freeMonthGrantedAt'
  )
ORDER BY column_name;

-- 2. Check if old referralCount column still exists (should return 0 rows)
SELECT 
  'Old column check' as check_type,
  column_name
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'referralCount';

-- 3. Check referrals table structure
SELECT 
  'Referrals table columns' as check_type,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'referrals'
ORDER BY column_name;

-- 4. Check if old columns still exist (should return 0 rows)
SELECT 
  'Old referral columns check' as check_type,
  column_name
FROM information_schema.columns
WHERE table_name = 'referrals' 
  AND column_name IN ('referred_user_tier', 'counted_at');

-- 5. Check indexes on referrals table
SELECT 
  'Referrals indexes' as check_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'referrals'
ORDER BY indexname;

-- 6. Sample data check (if any users exist)
SELECT 
  'Sample users data' as check_type,
  id,
  email,
  "freeMonthsGranted",
  "referralCode",
  "referredBy"
FROM users
LIMIT 5;

-- 7. Sample referrals data (if any exist)
SELECT 
  'Sample referrals data' as check_type,
  id,
  referrer_id,
  referred_user_id,
  status,
  "reward_granted_at",
  "referrer_rewarded",
  "referred_rewarded"
FROM referrals
LIMIT 5;

