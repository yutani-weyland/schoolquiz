-- Check User Premium Status
-- This SQL helps verify why a user might not be showing as premium
-- 
-- INSTRUCTIONS: Replace 'andrew@example.com' with the actual user email you want to check
-- in all the queries below

-- ============================================================================
-- 1. Check all premium-related fields for a specific user
-- ============================================================================
SELECT 
  id,
  email,
  name,
  tier,
  "subscriptionStatus",
  "subscriptionPlan",
  "subscriptionEndsAt",
  "freeTrialUntil",
  "freeTrialStartedAt",
  "freeTrialEndsAt",
  "platformRole",
  "createdAt",
  "lastLoginAt",
  -- Calculate if user SHOULD be premium based on the same logic as NextAuth
  CASE 
    WHEN tier = 'premium' THEN true
    WHEN "subscriptionStatus" IN ('ACTIVE', 'TRIALING') THEN true
    WHEN "freeTrialUntil" IS NOT NULL AND "freeTrialUntil" > NOW() THEN true
    ELSE false
  END AS should_be_premium,
  -- Show which condition makes them premium (if any)
  CASE 
    WHEN tier = 'premium' THEN 'tier = premium'
    WHEN "subscriptionStatus" IN ('ACTIVE', 'TRIALING') THEN 'subscriptionStatus = ' || "subscriptionStatus"
    WHEN "freeTrialUntil" IS NOT NULL AND "freeTrialUntil" > NOW() THEN 'freeTrialUntil = ' || "freeTrialUntil"::text || ' (future date)'
    ELSE 'None - user is basic'
  END AS premium_reason
FROM users
WHERE email = 'andrew@example.com';  -- ⬅️ REPLACE THIS EMAIL

-- ============================================================================
-- 2. Check if freeTrialUntil is in the future (this is one of the premium conditions)
-- ============================================================================
SELECT 
  email,
  "freeTrialUntil",
  NOW() AS current_time,
  "freeTrialUntil" > NOW() AS is_future,
  EXTRACT(EPOCH FROM ("freeTrialUntil" - NOW())) / 86400 AS days_until_expiry
FROM users
WHERE email = 'andrew@example.com'  -- ⬅️ REPLACE THIS EMAIL
  AND "freeTrialUntil" IS NOT NULL;

-- ============================================================================
-- 3. List all users and their premium status (for debugging)
-- ============================================================================
SELECT 
  email,
  tier,
  "subscriptionStatus",
  "freeTrialUntil",
  CASE 
    WHEN tier = 'premium' THEN true
    WHEN "subscriptionStatus" IN ('ACTIVE', 'TRIALING') THEN true
    WHEN "freeTrialUntil" IS NOT NULL AND "freeTrialUntil" > NOW() THEN true
    ELSE false
  END AS is_premium
FROM users
ORDER BY "createdAt" DESC
LIMIT 20;

-- ============================================================================
-- 4. Make a user premium - Option 1: Set tier directly
-- ============================================================================
-- Uncomment and run:
-- UPDATE users 
-- SET 
--   tier = 'premium',
--   "subscriptionStatus" = 'ACTIVE'
-- WHERE email = 'andrew@example.com';  -- ⬅️ REPLACE THIS EMAIL

-- ============================================================================
-- 5. Make a user premium - Option 2: Set subscription status
-- ============================================================================
-- Uncomment and run:
-- UPDATE users 
-- SET 
--   "subscriptionStatus" = 'ACTIVE'
-- WHERE email = 'andrew@example.com';  -- ⬅️ REPLACE THIS EMAIL

-- ============================================================================
-- 6. Make a user premium - Option 3: Set freeTrialUntil (trial-based premium)
-- ============================================================================
-- Uncomment and run:
-- UPDATE users 
-- SET 
--   "freeTrialUntil" = NOW() + INTERVAL '30 days'
-- WHERE email = 'andrew@example.com';  -- ⬅️ REPLACE THIS EMAIL

